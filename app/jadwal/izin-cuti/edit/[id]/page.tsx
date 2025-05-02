"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon, ArrowLeft } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import Link from "next/link";
import { id as localeId } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

interface LeaveRequest {
  id: string;
  userName: string;
  requestDate: string;
  leaveType: "OFF_DAY" | "IZIN";
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELED";
  createdAt: string;
  updatedAt: string;
}

function parseJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("Failed to parse JWT:", e);
    return null;
  }
}

export default function EditLeaveRequestPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [leaveRequest, setLeaveRequest] = useState<LeaveRequest | null>(null);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [leaveType, setLeaveType] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  // const [username, setUsername] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [canEdit, setCanEdit] = useState<boolean>(false);

  useEffect(() => {
    const fetchLeaveRequest = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          router.push("/login");
          return;
        }

        // Verify token has username
        const jwtPayload = parseJwt(token);
        if (!jwtPayload || !jwtPayload.sub) {
          console.log("No username in JWT, redirecting to login");
          router.push("/login");
          return;
        }

        setIsLoading(true);
        const response = await fetch(
          `http://localhost:8080/api/shift-management/leave-request/${id}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Error fetching leave request: ${response.status}`);
        }

        const result = await response.json();
        setLeaveRequest(result.data);

        // Set form values
        if (result.data) {
          setDate(new Date(result.data.requestDate));
          setLeaveType(result.data.leaveType);
          setReason(result.data.reason);
          setCanEdit(result.data.status === "PENDING");
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
        console.error("Error fetching leave request:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchLeaveRequest();
    }
  }, [id, router]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!date) {
      newErrors.date = "Tanggal permohonan wajib diisi";
    }

    if (!leaveType) {
      newErrors.leaveType = "Jenis permohonan wajib dipilih";
    }

    if (!reason.trim()) {
      newErrors.reason = "Alasan permohonan wajib diisi";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("token");

      const requestDate = date
        ? `${date.getFullYear()}-${(date.getMonth() + 1)
            .toString()
            .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`
        : null;

      const requestBody = {
        // username: username,
        // requestDate: date?.toISOString().split("T")[0],
        requestDate,
        leaveType: leaveType,
        reason: reason,
      };

      const response = await fetch(
        `http://localhost:8080/api/shift-management/leave-request/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Gagal mengubah permohonan");
      }

      // Update local state with the response data
      const result = await response.json();
      setLeaveRequest(result.data);

      alert("Permohonan berhasil diubah!");
      router.push("/jadwal/izin-cuti/barista/list");
    } catch (err) {
      console.error("Error saat mengubah permohonan:", err);
      alert(
        err instanceof Error
          ? err.message
          : "Gagal mengubah permohonan. Silakan coba lagi."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Apakah Anda yakin ingin membatalkan permohonan ini?")) {
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("token");

      const requestDate = date
        ? `${date.getFullYear()}-${(date.getMonth() + 1)
            .toString()
            .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`
        : null;

      // Create a request body with the canceled field set to true
      const requestBody = {
        requestDate: requestDate,
        leaveType: leaveType,
        reason: reason,
        canceled: true, // This is the key field needed for cancellation
      };

      const response = await fetch(
        `http://localhost:8080/api/shift-management/leave-request/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Gagal membatalkan permohonan");
      }

      // Update local state with the canceled status
      setLeaveRequest({
        ...leaveRequest!,
        status: "CANCELED",
      });

      // Set canEdit to false since canceled requests can't be edited
      setCanEdit(false);

      alert("Permohonan berhasil dibatalkan!");

      // Wait a moment before redirecting to show the updated status
      setTimeout(() => {
        router.push("/jadwal/izin-cuti/barista/list");
      }, 1000);
    } catch (err) {
      console.error("Error saat membatalkan permohonan:", err);
      alert(
        err instanceof Error
          ? err.message
          : "Gagal membatalkan permohonan. Silakan coba lagi."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-100 text-yellow-800 border-yellow-300"
          >
            Menunggu
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge
            variant="outline"
            className="bg-green-100 text-green-800 border-green-300"
          >
            Disetujui
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge
            variant="outline"
            className="bg-red-100 text-red-800 border-red-300"
          >
            Ditolak
          </Badge>
        );
      case "CANCELED":
        return (
          <Badge
            variant="outline"
            className="bg-gray-100 text-gray-800 border-gray-300"
          >
            Dibatalkan
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Safe format function that handles locale issues
  const formatDate = (date: Date | undefined) => {
    if (!date) return "Pilih tanggal";

    try {
      return format(date, "EEEE, dd MMMM yyyy", { locale: localeId });
    } catch (error) {
      console.error("Error formatting date:", error);
      // Fallback to simple date format without locale
      return date.toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-destructive text-center">
          <h3 className="text-xl font-semibold mb-2">Error Loading Data</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!leaveRequest) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-2">
            Permohonan Tidak Ditemukan
          </h3>
          <p>Permohonan yang Anda cari tidak ditemukan.</p>
          <Link
            href="/jadwal/izin-cuti/barista/list"
            className="mt-4 inline-block"
          >
            <Button>Kembali ke Daftar Permohonan</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/jadwal/izin-cuti/barista/list">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">
            {canEdit
              ? "Edit Permohonan Izin/Cuti"
              : "Detail Permohonan Izin/Cuti"}
          </h1>
        </div>

        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Form Permohonan</CardTitle>
              <div>{getStatusBadge(leaveRequest.status)}</div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Barista</Label>
                <Input
                  id="name"
                  value={leaveRequest.userName}
                  disabled
                  className="bg-gray-50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Tanggal Izin/Cuti</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`w-full justify-start text-left font-normal ${
                        !date && "text-muted-foreground"
                      } ${errors.date ? "border-red-500" : ""}`}
                      disabled={!canEdit}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formatDate(date)}
                    </Button>
                  </PopoverTrigger>
                  {canEdit && (
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                        disabled={(date) =>
                          date < new Date(new Date().setHours(0, 0, 0, 0))
                        }
                      />
                    </PopoverContent>
                  )}
                </Popover>
                {errors.date && (
                  <p className="text-red-500 text-sm">{errors.date}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="leaveType">Jenis Permohonan</Label>
                <Select
                  value={leaveType}
                  onValueChange={setLeaveType}
                  disabled={!canEdit}
                >
                  <SelectTrigger
                    id="leaveType"
                    className={errors.leaveType ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder="Pilih jenis permohonan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OFF_DAY">Cuti</SelectItem>
                    <SelectItem value="IZIN">Izin</SelectItem>
                  </SelectContent>
                </Select>
                {errors.leaveType && (
                  <p className="text-red-500 text-sm">{errors.leaveType}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Alasan</Label>
                <Textarea
                  id="reason"
                  placeholder="Masukkan alasan permohonan secara detail"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className={errors.reason ? "border-red-500" : ""}
                  rows={4}
                  disabled={!canEdit}
                />
                {errors.reason && (
                  <p className="text-red-500 text-sm">{errors.reason}</p>
                )}
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <Link href="/jadwal/izin-cuti/barista/list">
                  <Button variant="outline" type="button">
                    Kembali
                  </Button>
                </Link>

                {leaveRequest.status !== "CANCELED" && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                  >
                    Batalkan Permohonan
                  </Button>
                )}

                {canEdit && (
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Memproses..." : "Simpan Perubahan"}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
