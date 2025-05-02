"use client";

import React, { useState, useEffect } from "react";

interface Outlet {
  outletId: number;
  name: string;
  headBarName: string;
  headBarId: string;
}

export default function TambahLogLembur() {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: string; message: string } | null>(
    null
  );
  const [token, setToken] = useState<string | null>(null);

  const [outlets, setOutlets] = useState<
    { outletId: number; name: string; headBarName: string; headBarId: string }[]
  >([]);

  const [currentOutlet, setCurrentOutlet] = useState<Outlet | null>(null);

  const [formData, setFormData] = useState({
    dateOvertime: "",
    startHour: "",
    outletId: "",
    duration: "",
    reason: "",
    verifier: "",
    status: "ONGOING",
  });

  // ✅ FETCH TOKEN & OUTLETS
  useEffect(() => {
    const storedToken = localStorage.getItem("token");

    console.log("🟢 Token ditemukan:", storedToken);

    if (!storedToken) {
      setToast({
        type: "Gagal",
        message: "Token tidak ditemukan. Silakan login ulang!",
      });
      return;
    }

    setToken(storedToken);
    fetchOutlets(storedToken);
  }, []);

  // FETCH OUTLETS
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

      console.log("🟢 Outlets data:", data);

      setOutlets(data);
    } catch (error) {
      console.error("❌ Gagal fetch outlets:", error);
      setToast({ type: "Gagal", message: "Gagal mengambil daftar outlet" });
    }
  };

  // ✅ HANDLE FORM CHANGE
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: name === "duration" ? value.replace(/\D/g, "") : value,
    }));

    if (name === "outletId") {
      const selectedOutlet = outlets.find(
        (outlet) => outlet.outletId === parseInt(value)
      );

      if (selectedOutlet) {
        setCurrentOutlet(selectedOutlet);

        // INI FIX-NYA
        const headbarName = selectedOutlet.headBarName || "Tidak Ada Headbar";

        console.log("✅ Outlet dipilih:", selectedOutlet);
        console.log("✅ Verifier:", headbarName);

        setFormData((prev) => ({
          ...prev,
          outletId: value,
          verifier: headbarName,
        }));
      } else {
        console.warn("❌ Outlet tidak ditemukan untuk id:", value);
        setCurrentOutlet(null);
        setFormData((prev) => ({
          ...prev,
          outletId: value,
          verifier: "",
        }));
      }
    }
  };

  // ✅ HANDLE SUBMIT
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setToast({
        type: "Gagal",
        message: "Token tidak valid. Silakan login ulang!",
      });
      return;
    }

    setLoading(true);

    try {
      const payload = {
        baristaId: 1, // Ubah sesuai kebutuhan
        userId: "00000000-0000-0000-0000-000000000000", // Ubah sesuai kebutuhan
        outletId: parseInt(formData.outletId),
        dateOvertime: formData.dateOvertime,
        startHour: formData.startHour,
        duration: formData.duration.padStart(2, "0") + ":00",
        reason: formData.reason,
        verifier: formData.verifier,
      };

      console.log("🟢 Payload dikirim:", payload);
      console.log("🟢 Current Outlet:", currentOutlet);

      const res = await fetch(`http://localhost:8080/api/overtime-logs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const contentType = res.headers.get("content-type");

        if (contentType && contentType.includes("application/json")) {
          const data = await res.json();
          throw new Error(data.message || "Gagal menyimpan data");
        } else {
          const text = await res.text();
          throw new Error(text || "Gagal menyimpan data");
        }
      }

      setToast({
        type: "Berhasil",
        message: "Log lembur berhasil ditambahkan!",
      });

      setTimeout(() => {
        window.location.href = "/jadwal/lembur";
      }, 1500);
    } catch (error) {
      console.error("❌ Error submit:", error);
      setToast({ type: "Gagal", message: "gagal" });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    window.location.href = "/jadwal/lembur";
  };

  return (
    <div className="py-10 px-4">
      <h1 className="text-3xl font-bold text-center text-[#4169E1] mb-10">
        Tambah Log Lembur
      </h1>

      <div className="max-w-3xl mx-auto bg-white border rounded-lg p-8 shadow space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tanggal Lembur */}
          <div>
            <label htmlFor="dateOvertime" className="block mb-2 font-medium">
              Tanggal Lembur
            </label>
            <input
              id="dateOvertime"
              name="dateOvertime"
              type="date"
              value={formData.dateOvertime}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded p-2"
            />
          </div>

          {/* Jam Mulai */}
          <div>
            <label htmlFor="startHour" className="block mb-2 font-medium">
              Jam Mulai
            </label>
            <input
              id="startHour"
              name="startHour"
              type="time"
              value={formData.startHour}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded p-2"
            />
          </div>

          {/* Outlet */}
          <div>
            <label htmlFor="outletId" className="block mb-2 font-medium">
              Outlet
            </label>
            <select
              id="outletId"
              name="outletId"
              value={formData.outletId}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded p-2"
            >
              <option value="">-- Pilih Outlet --</option>
              {outlets.map((outlet) => (
                <option key={outlet.outletId} value={outlet.outletId}>
                  {outlet.name}
                </option>
              ))}
            </select>

            {currentOutlet && (
              <p className="text-sm text-gray-500 mt-1">
                Headbar:{" "}
                <strong>
                  {currentOutlet.headBarName || "Tidak Ada Headbar"}
                </strong>
              </p>
            )}
          </div>

          {/* Durasi */}
          <div>
            <label htmlFor="duration" className="block mb-2 font-medium">
              Durasi (Jam)
            </label>
            <input
              id="duration"
              name="duration"
              type="number"
              value={formData.duration}
              onChange={handleChange}
              min={1}
              required
              className="w-full border border-gray-300 rounded p-2"
            />
          </div>

          {/* Alasan */}
          <div>
            <label htmlFor="reason" className="block mb-2 font-medium">
              Alasan Lembur
            </label>
            <textarea
              id="reason"
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              rows={4}
              maxLength={50}
              required
              className="w-full border border-gray-300 rounded p-2"
            />
            <div className="text-xs text-right text-gray-500">
              {formData.reason.length}/50 karakter
            </div>
          </div>

          {/* Verifikator */}
          <div>
            <label htmlFor="verifier" className="block mb-2 font-medium">
              Verifikator
            </label>
            <input
              id="verifier"
              name="verifier"
              value={formData.verifier}
              readOnly
              className="w-full border border-gray-300 rounded p-2 bg-gray-100"
            />
          </div>

          {/* Status */}
          <div>
            <label htmlFor="status" className="block mb-2 font-medium">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded p-2"
            >
              <option value="ONGOING">Ongoing</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              className="w-40 border border-red-500 text-red-500 hover:bg-red-50 rounded py-2"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-40 bg-[#4169E1] hover:bg-[#3a5ecc] text-white rounded py-2"
            >
              {loading ? "Menyimpan..." : "Simpan Log"}
            </button>
          </div>
        </form>

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
