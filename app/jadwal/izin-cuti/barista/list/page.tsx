"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, PencilIcon, EyeIcon } from "lucide-react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

export default function LeaveRequestListPage() {
  const router = useRouter();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const fetchLeaveRequests = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          console.log("No token, redirecting to login");
          router.push("/login");
          return;
        }

        // Get username from JWT token
        const jwtPayload = parseJwt(token);
        let username = "";

        if (jwtPayload && jwtPayload.sub) {
          username = jwtPayload.sub;
          console.log("Username from JWT:", username);
        } else {
          console.log("No username in JWT, redirecting to login");
          router.push("/login");
          return;
        }

        setIsLoading(true);
        const response = await fetch(
          `http://localhost:8080/api/shift-management/leave-request/user/username/${username}`,
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
        setLeaveRequests(result.data || []);
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

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:8080/api/shift-management/leave-request/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error deleting leave request: ${response.status}`);
      }

      setLeaveRequests((prevRequests) =>
        prevRequests.filter((request) => request.id !== id)
      );

      setIsDialogOpen(false);
    } catch (err) {
      console.error("Error deleting leave request:", err);
      alert(
        err instanceof Error
          ? err.message
          : "Gagal menghapus permohonan. Silakan coba lagi."
      );
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString("id-ID", options);
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
      <div className="flex flex-col">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/jadwal/izin-cuti/barista">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Daftar Permohonan Izin/Cuti</h1>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Permohonan Saya</CardTitle>
            <Link href="/jadwal/izin-cuti/create">
              <Button>Ajukan Permohonan Baru</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {leaveRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Tidak ada permohonan yang ditemukan
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Jenis</TableHead>
                    <TableHead>Alasan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaveRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>{formatDate(request.requestDate)}</TableCell>
                      <TableCell>
                        {request.leaveType === "IZIN" ? "Izin" : "Cuti"}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {request.reason}
                      </TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/jadwal/izin-cuti/edit/${request.id}`}>
                            <Button
                              variant="outline"
                              size="icon"
                              title="Lihat Detail"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </Button>
                          </Link>

                          {request.status === "PENDING" && (
                            <>
                              <Link
                                href={`/jadwal/izin-cuti/edit/${request.id}`}
                              >
                                <Button
                                  variant="outline"
                                  size="icon"
                                  title="Edit"
                                >
                                  <PencilIcon className="h-4 w-4" />
                                </Button>
                              </Link>

                              <Dialog
                                open={isDialogOpen && deleteId === request.id}
                                onOpenChange={(open) => {
                                  setIsDialogOpen(open);
                                  if (!open) setDeleteId(null);
                                }}
                              >
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Konfirmasi Hapus</DialogTitle>
                                    <DialogDescription>
                                      Apakah Anda yakin ingin menghapus
                                      permohonan ini? Tindakan ini tidak dapat
                                      dibatalkan.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <DialogFooter className="flex justify-end gap-2 mt-4">
                                    <Button
                                      variant="outline"
                                      onClick={() => setIsDialogOpen(false)}
                                    >
                                      Batal
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      onClick={() => handleDelete(request.id)}
                                    >
                                      Hapus
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
