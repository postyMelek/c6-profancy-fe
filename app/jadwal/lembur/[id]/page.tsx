"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

interface OvertimeLog {
  id: string;
  dateOvertime: string;
  startHour: string;
  outletId: number | null;
  outletName: string;
  duration: string;
  reason: string;
  verifier: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function OvertimeLogDetail() {
  const router = useRouter();
  const params = useParams();

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [toast, setToast] = useState<{ type: string; message: string } | null>(
    null
  );
  const [token, setToken] = useState<string | null>(null);

  const [overtimeLog, setOvertimeLog] = useState<OvertimeLog | null>(null);
  const [outlets, setOutlets] = useState<
    { outletId: number; name: string; headBarName: string; headBarId: string }[]
  >([]);

  const [formData, setFormData] = useState({
    dateOvertime: "",
    startHour: "",
    outletId: "",
    outletName: "",
    duration: "",
    reason: "",
    verifier: "",
    status: "",
  });

  useEffect(() => {
    const storedToken = localStorage.getItem("token");

    if (!storedToken) {
      setToast({
        type: "Gagal",
        message: "Token tidak ditemukan. Silakan login ulang!",
      });
      setLoading(false);
      return;
    }

    setToken(storedToken);
    fetchOvertimeLogDetail(storedToken);
    fetchOutlets(storedToken);
  }, [params?.id]);

  const fetchOutlets = async (storedToken: string) => {
    try {
      const res = await fetch("http://localhost:8080/api/outlets", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${storedToken}`,
        },
      });

      if (!res.ok) throw new Error("Gagal mengambil data outlet");

      const data = await res.json();
      setOutlets(data);
    } catch (error) {
      console.error("❌ Gagal fetch outlets:", error);
      setToast({ type: "Gagal", message: "Gagal mengambil daftar outlet" });
    }
  };

  const fetchOvertimeLogDetail = async (storedToken: string) => {
    if (!params?.id) {
      setToast({ type: "Gagal", message: "ID lembur tidak valid" });
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:8080/api/overtime-logs/${params.id}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        }
      );

      if (!res.ok) throw new Error("Gagal mengambil detail log lembur");

      const data = await res.json();
      setOvertimeLog(data);

      setFormData({
        dateOvertime: data.dateOvertime || "",
        startHour: data.startHour ? data.startHour.substring(0, 5) : "",
        outletId: data.outletId ? data.outletId.toString() : "",
        outletName: data.outletName || "",
        duration: data.duration ? data.duration.substring(0, 2) : "",
        reason: data.reason || "",
        verifier: data.verifier || "",
        status: data.status || "",
      });
    } catch (error) {
      console.error("❌ Gagal fetch overtime log detail:", error);
      setToast({ type: "Gagal", message: "Gagal mengambil detail log lembur" });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      status: e.target.value,
    }));
  };

  const handleUpdateStatus = async () => {
    if (!token) {
      setToast({
        type: "Gagal",
        message: "Token tidak valid. Silakan login ulang!",
      });
      return;
    }

    setUpdating(true);

    try {
      const res = await fetch(
        `http://localhost:8080/api/overtime-logs/${params.id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: formData.status }),
        }
      );

      if (!res.ok) {
        const contentType = res.headers.get("content-type");

        if (contentType && contentType.includes("application/json")) {
          const data = await res.json();
          throw new Error(data.message || "Gagal memperbarui status");
        } else {
          const text = await res.text();
          throw new Error(text || "Gagal memperbarui status");
        }
      }

      setToast({ type: "Berhasil", message: "Status berhasil diperbarui!" });
      fetchOvertimeLogDetail(token);
    } catch (error) {
      console.error("❌ Error update status:", error);
      setToast({ type: "Gagal", message: "Gagal mengambil detail log lembur" });
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = () => {
    router.push("/jadwal/lembur");
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    // try {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    // } catch (e) {
    //   return dateString;
    // }
  };

  const getVerifierName = () => {
    if (formData.verifier && formData.verifier.trim() !== "") {
      return formData.verifier;
    }

    const outlet = outlets.find(
      (o) => o.outletId === parseInt(formData.outletId)
    );
    return outlet?.headBarName || "-";
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "text-green-600";
      case "REJECTED":
        return "text-red-600";
      case "PENDING":
        return "text-yellow-600";
      case "ONGOING":
        return "text-blue-600";
      case "CANCELLED":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "Diterima";
      case "REJECTED":
        return "Ditolak";
      case "PENDING":
        return "Menunggu Konfirmasi";
      case "ONGOING":
        return "Ongoing";
      case "CANCELLED":
        return "Cancelled";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#4169E1]"></div>
      </div>
    );
  }

  return (
    <div className="py-10 px-4">
      <h1 className="text-3xl font-bold text-center text-[#4169E1] mb-10">
        Detail Log Lembur{" "}
        <span className={getStatusClass(formData.status)}>
          ({getStatusDisplay(formData.status)})
        </span>
      </h1>

      <div className="max-w-3xl mx-auto bg-white border rounded-lg p-8 shadow space-y-6">
        <div className="space-y-6">
          <div>
            <label htmlFor="dateOvertime" className="block mb-2 font-medium">
              Tanggal Lembur
            </label>
            <input
              id="dateOvertime"
              name="dateOvertime"
              type="text"
              value={formatDate(formData.dateOvertime)}
              readOnly
              className="w-full border border-gray-300 rounded p-2 bg-gray-100"
            />
          </div>

          <div>
            <label htmlFor="startHour" className="block mb-2 font-medium">
              Jam Mulai
            </label>
            <input
              id="startHour"
              name="startHour"
              type="text"
              value={formData.startHour}
              readOnly
              className="w-full border border-gray-300 rounded p-2 bg-gray-100"
            />
          </div>

          <div>
            <label htmlFor="outletName" className="block mb-2 font-medium">
              Outlet
            </label>
            <input
              id="outletName"
              name="outletName"
              type="text"
              value={formData.outletName}
              readOnly
              className="w-full border border-gray-300 rounded p-2 bg-gray-100"
            />
          </div>

          <div>
            <label htmlFor="duration" className="block mb-2 font-medium">
              Durasi (Jam)
            </label>
            <input
              id="duration"
              name="duration"
              type="text"
              value={formData.duration}
              readOnly
              className="w-full border border-gray-300 rounded p-2 bg-gray-100"
            />
          </div>

          <div>
            <label htmlFor="reason" className="block mb-2 font-medium">
              Alasan Lembur
            </label>
            <textarea
              id="reason"
              name="reason"
              value={formData.reason}
              readOnly
              rows={4}
              className="w-full border border-gray-300 rounded p-2 bg-gray-100"
            />
          </div>

          <div>
            <label htmlFor="verifier" className="block mb-2 font-medium">
              Verifikator
            </label>
            <input
              id="verifier"
              name="verifier"
              value={getVerifierName()}
              readOnly
              className="w-full border border-gray-300 rounded p-2 bg-gray-100"
            />
          </div>

          <div>
            <label htmlFor="status" className="block mb-2 font-medium">
              Status
            </label>
            {overtimeLog?.status === "PENDING" ? (
              <div className="space-y-2">
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleStatusChange}
                  className="w-full border border-gray-300 rounded p-2"
                >
                  <option value="ONGOING">Ongoing</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
                <button
                  type="button"
                  onClick={handleUpdateStatus}
                  disabled={updating || formData.status === overtimeLog?.status}
                  className="mt-2 bg-[#4169E1] hover:bg-[#3a5ecc] text-white rounded py-2 px-4 disabled:bg-gray-400"
                >
                  {updating ? "Memperbarui..." : "Perbarui Status"}
                </button>
              </div>
            ) : (
              <input
                type="text"
                value={getStatusDisplay(formData.status)}
                readOnly
                className={`w-full border border-gray-300 rounded p-2 bg-gray-100 ${getStatusClass(
                  formData.status
                )}`}
              />
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <div>
              <label className="block mb-2 text-sm text-gray-500">
                Tanggal Dibuat
              </label>
              <input
                type="text"
                value={formatDate(overtimeLog?.createdAt || "")}
                readOnly
                className="w-full border border-gray-300 rounded p-2 bg-gray-100 text-sm"
              />
            </div>
            <div>
              <label className="block mb-2 text-sm text-gray-500">
                Terakhir Diperbarui
              </label>
              <input
                type="text"
                value={formatDate(overtimeLog?.updatedAt || "")}
                readOnly
                className="w-full border border-gray-300 rounded p-2 bg-gray-100 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-center gap-4 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              className="w-40 border border-[#4169E1] text-[#4169E1] hover:bg-blue-50 rounded py-2"
            >
              Kembali
            </button>
          </div>
        </div>

        {toast && (
          <div
            className={`mt-4 p-4 rounded ${
              toast.type === "Berhasil" ? "bg-green-500" : "bg-red-500"
            } text-white`}
          >
            {toast.message}
            <button
              onClick={() => setToast(null)}
              className="float-right font-bold"
            >
              X
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
