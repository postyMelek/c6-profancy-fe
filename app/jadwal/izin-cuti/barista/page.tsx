"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Clock, Plus, Eye } from "lucide-react";
import Link from "next/link";

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

export default function BaristaLeaveRequestPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stats
  const [totalIzin, setTotalIzin] = useState(0);
  const [totalCuti, setTotalCuti] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [recentRequests, setRecentRequests] = useState<LeaveRequest[]>([]);

  // Fetch leave requests for the current user
  useEffect(() => {
    const fetchLeaveRequests = async () => {
      try {
        // For testing - add this to debug login issues
        console.log("Checking auth...");
        const token = localStorage.getItem("token");

        console.log("Token exists:", !!token);

        if (!token) {
          console.log("No token, redirecting to login");
          router.push("/login");
          return;
        }

        // Parse JWT to get username
        const jwtPayload = parseJwt(token);
        let currentUsername = "";

        if (jwtPayload && jwtPayload.sub) {
          currentUsername = jwtPayload.sub;
        } else {
          console.log("No username in JWT, redirecting to login");
          router.push("/login");
          return;
        }

        setIsLoading(true);

        // Fetch user's leave requests using username
        const response = await fetch(
          `http://localhost:8080/api/shift-management/leave-request/user/username/${currentUsername}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Error fetching leave requests: ${response.status}`);
        }

        const result = await response.json();
        const requests = result.data || [];

        // Calculate stats
        let izinCount = 0;
        let cutiCount = 0;
        let pendingCount = 0;

        requests.forEach((request: LeaveRequest) => {
          if (request.leaveType === "IZIN") {
            izinCount++;
          } else if (request.leaveType === "OFF_DAY") {
            cutiCount++;
          }

          if (request.status === "PENDING") {
            pendingCount++;
          }
        });

        setTotalIzin(izinCount);
        setTotalCuti(cutiCount);
        setPendingRequests(pendingCount);

        // Get recent requests (last 5)
        const sortedRequests = [...requests].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setRecentRequests(sortedRequests.slice(0, 5));
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
        console.error("Error fetching leave requests:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaveRequests();
  }, [router]);

  // Format date for display
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString("id-ID", options);
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

  return (
    <div className="container mx-auto p-6">
      {/* Header */}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium">Total Izin</h3>
                <p className="text-4xl font-bold mt-2">{totalIzin}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Permohonan izin
                </p>
              </div>
              <FileText className="h-6 w-6 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium">Total Cuti</h3>
                <p className="text-4xl font-bold mt-2">{totalCuti}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Permohonan cuti
                </p>
              </div>
              <FileText className="h-6 w-6 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium">Pending Requests</h3>
                <p className="text-4xl font-bold mt-2">{pendingRequests}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Menunggu persetujuan
                </p>
              </div>
              <Clock className="h-6 w-6 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quick Menu */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-1">Menu Cepat</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Akses cepat ke fitur utama
            </p>

            <div className="space-y-4">
              <Link
                href="/jadwal/izin-cuti/barista/list"
                className="w-full block"
              >
                <Button className="w-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2">
                  <Eye size={18} />
                  <span>Lihat Permohonan Saya</span>
                </Button>
              </Link>

              <Link href="/jadwal/izin-cuti/create" className="w-full block">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2">
                  <Plus size={18} />
                  <span>Ajukan Permohonan Baru</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent Requests */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-1">Permohonan Terbaru</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Permohonan yang baru diajukan
            </p>

            {recentRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Tidak ada permohonan terbaru
              </div>
            ) : (
              <div className="space-y-4">
                {recentRequests.map((request) => (
                  <div key={request.id} className="border-b pb-4 last:border-0">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium">
                          {request.leaveType === "IZIN" ? "Izin" : "Cuti"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(request.requestDate)}
                        </p>
                      </div>
                      <div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            request.status === "PENDING"
                              ? "bg-yellow-100 text-yellow-800"
                              : request.status === "APPROVED"
                              ? "bg-green-100 text-green-800"
                              : request.status === "REJECTED"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {request.status === "PENDING"
                            ? "Menunggu"
                            : request.status === "APPROVED"
                            ? "Disetujui"
                            : request.status === "REJECTED"
                            ? "Ditolak"
                            : "Dibatalkan"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
