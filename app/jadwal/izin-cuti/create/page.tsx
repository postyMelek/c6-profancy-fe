"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { id } from "date-fns/locale";
import Link from "next/link";
import Toast from "@/components/Toast";

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

export default function CreateLeaveRequestPage() {
  const router = useRouter();
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [leaveType, setLeaveType] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [username, setUsername] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");
  const [outlet, setOutlet] = useState<string>("");
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    // Get token from localStorage
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    // Parse JWT to get user info
    const jwtPayload = parseJwt(token);
    if (jwtPayload && jwtPayload.sub) {
      setUsername(jwtPayload.sub);
    }

    // Fetch user profile for additional info
    const fetchUserProfile = async () => {
      try {
        const response = await fetch(`http://localhost:8080/api/user/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.data) {
            setFullName(data.data.fullName || username);
            if (data.data.outlet) {
              setOutlet(data.data.outlet.name || "-");
            }
          }
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };

    fetchUserProfile();
  }, [router, username]);

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

  // Safe format function that handles locale issues
  const formatDate = (date: Date | undefined) => {
    if (!date) return "Pilih tanggal";

    try {
      return format(date, "EEEE, dd MMMM yyyy", { locale: id });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!username) {
      // alert("Data pengguna tidak ditemukan. Silakan login kembali.");
      setToast({
        type: "error",
        message: "Data pengguna tidak ditemukan. Silakan login kembali.",
      });
      router.push("/login");
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
        username: username,
        // requestDate: date?.toISOString().split("T")[0],
        requestDate,
        leaveType: leaveType,
        reason: reason,
      };

      const response = await fetch(
        "http://localhost:8080/api/shift-management/leave-request/create",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        setToast({
          type: "error",
          message: errorData.message || "Gagal membuat permohonan",
        });
        // throw new Error(errorData.message);
        return;
      }

      // alert("Permohonan berhasil dibuat!");
      setToast({ type: "success", message: "Permohonan berhasil dibuat!" });
      setTimeout(() => {
        router.push("/jadwal/izin-cuti/barista");
      }, 1500);
    } catch (err) {
      console.error("Error saat membuat permohonan:", err);
      setToast({
        type: "error",
        message:
          err instanceof Error
            ? err.message
            : "Gagal membuat permohonan. Silakan coba lagi.",
      });
      // alert(
      //   err instanceof Error
      //     ? err.message
      //     : "Gagal membuat permohonan. Silakan coba lagi."
      // );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-[9999]">
          <Toast
            type={toast.type}
            message={toast.message}
            onClose={() => setToast(null)}
          />
        </div>
      )}

      <div className="container mx-auto p-6">
        <div className="flex flex-col">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/jadwal/izin-cuti/barista">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Buat Permohonan Izin/Cuti</h1>
          </div>

          <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Form Permohonan</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Barista</Label>
                  <Input
                    id="name"
                    value={fullName || username || "Loading..."}
                    disabled
                    className="bg-gray-50"
                  />
                </div>

                {outlet && (
                  <div className="space-y-2">
                    <Label htmlFor="outlet">Outlet</Label>
                    <Input
                      id="outlet"
                      value={outlet}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="date">Tanggal Izin/Cuti</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={`w-full justify-start text-left font-normal ${
                          !date && "text-muted-foreground"
                        } ${errors.date ? "border-red-500" : ""}`}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formatDate(date)}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                        disabled={(d) =>
                          d < new Date(new Date().setHours(0, 0, 0, 0))
                        }
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.date && (
                    <p className="text-red-500 text-sm">{errors.date}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="leaveType">Jenis Permohonan</Label>
                  <Select value={leaveType} onValueChange={setLeaveType}>
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
                  />
                  {errors.reason && (
                    <p className="text-red-500 text-sm">{errors.reason}</p>
                  )}
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <Link href="/jadwal/izin-cuti/barista">
                    <Button variant="outline" type="button">
                      Batal
                    </Button>
                  </Link>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Memproses..." : "Ajukan Permohonan"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
