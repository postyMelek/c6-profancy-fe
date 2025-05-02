"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckCircle, XCircle, Search, Filter } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  idOutlet?: number; // Added to match your DTO
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

export default function ApprovalPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestId = searchParams.get("id");

  const [pendingRequests, setPendingRequests] = useState<LeaveRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(
    null
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(
    null
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentOutletId, setCurrentOutletId] = useState<number | null>(null);
  const [outletName, setOutletName] = useState<string>("");

  useEffect(() => {
    const fetchPendingRequests = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          router.push("/login");
          return;
        }

        // Get user info from JWT
        const jwtPayload = parseJwt(token);
        if (!jwtPayload || !jwtPayload.sub) {
          console.log("Invalid token, redirecting to login");
          router.push("/login");
          return;
        }

        setIsLoading(true);

        // Fetch ALL leave requests and filter for pending ones
        const response = await fetch(
          `http://localhost:8080/api/shift-management/leave-request/all`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Error fetching requests: ${response.status}`);
        }

        const result = await response.json();
        console.log("Raw API response:", result); // Debug log

        const allRequests = result.data || [];

        // First, try to find the outlet ID for the current user
        if (!currentOutletId) {
          // Get outlet ID from JWT if available
          if (jwtPayload.outletId) {
            setCurrentOutletId(Number.parseInt(jwtPayload.outletId));
            console.log("Found outlet ID from JWT:", jwtPayload.outletId);
            setOutletName(`Outlet #${jwtPayload.outletId}`);
          } else {
            // If not in JWT, try to get from localStorage
            const storedOutletId = localStorage.getItem("outletId");
            if (storedOutletId) {
              setCurrentOutletId(Number.parseInt(storedOutletId));
              console.log("Found outlet ID from localStorage:", storedOutletId);
              setOutletName(`Outlet #${storedOutletId}`);
            }
          }
        }

        // Filter requests by outlet ID and pending status
        let filteredByOutlet = allRequests;
        if (currentOutletId) {
          filteredByOutlet = allRequests.filter(
            (req: LeaveRequest) => req.idOutlet === currentOutletId
          );
          console.log(
            `Filtered to ${filteredByOutlet.length} requests for outlet ID ${currentOutletId}`
          );
        } else {
          console.warn(
            "No outlet ID found for filtering. Showing all requests."
          );
        }

        // Filter for pending requests only
        const pendingReqs = filteredByOutlet.filter(
          (req: LeaveRequest) => req.status === "PENDING"
        );

        setPendingRequests(pendingReqs);
        setFilteredRequests(pendingReqs);

        // If there's a request ID in the URL, select that request
        if (requestId) {
          const selectedReq =
            pendingReqs.find((req: LeaveRequest) => req.id === requestId) ||
            null;
          if (selectedReq) {
            setSelectedRequest(selectedReq);
            setIsDialogOpen(true);
            setActionType("approve"); // Default to approve dialog
          }
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
        console.error("Error fetching pending requests:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPendingRequests();
  }, [router, requestId, currentOutletId]);

  // Apply filters and search
  useEffect(() => {
    let results = pendingRequests;

    // Apply search term
    if (searchTerm) {
      results = results.filter(
        (req) =>
          req.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          req.reason.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply type filter
    if (filterType !== "all") {
      results = results.filter((req) => req.leaveType === filterType);
    }

    setFilteredRequests(results);
  }, [searchTerm, filterType, pendingRequests]);

  // Format date for display
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    };
    return new Date(dateString).toLocaleDateString("id-ID", options);
  };

  const handleApprove = async (request: LeaveRequest) => {
    setSelectedRequest(request);
    setActionType("approve");
    setIsDialogOpen(true);
  };

  const handleReject = async (request: LeaveRequest) => {
    setSelectedRequest(request);
    setActionType("reject");
    setIsDialogOpen(true);
  };

  const confirmAction = async () => {
    if (!selectedRequest || !actionType) return;

    setIsProcessing(true);

    try {
      const token = localStorage.getItem("token");

      // Use the correct endpoint from your controller
      const response = await fetch(
        `http://localhost:8080/api/shift-management/leave-request/${selectedRequest.id}/status`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: actionType === "approve" ? "APPROVED" : "REJECTED",
            notes: "", // Add notes if your API requires it
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Error ${actionType}ing request: ${response.status}`);
      }

      // Remove the request from the list
      setPendingRequests((prev) =>
        prev.filter((req) => req.id !== selectedRequest.id)
      );

      setIsDialogOpen(false);
      setSelectedRequest(null);
      setActionType(null);
    } catch (err) {
      console.error(`Error ${actionType}ing request:`, err);
      alert(
        err instanceof Error
          ? err.message
          : `Gagal ${
              actionType === "approve" ? "menyetujui" : "menolak"
            } permohonan. Silakan coba lagi.`
      );
    } finally {
      setIsProcessing(false);
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
          <Button
            className="mt-4"
            onClick={() => {
              console.log("Current outlet ID:", currentOutletId);
              console.log("Pending requests:", pendingRequests);
              alert("Check console for debug data");
            }}
          >
            Debug: Show Raw Data
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/jadwal/izin-cuti/headbar">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">
              Approval Permohonan Izin/Cuti
            </h1>
            {outletName && (
              <p className="text-sm text-muted-foreground">
                Outlet: {outletName}
              </p>
            )}
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Permohonan Menunggu Persetujuan</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Cari nama atau alasan..."
                  className="pl-8 w-[250px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[180px]">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <SelectValue placeholder="Filter jenis" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Jenis</SelectItem>
                  <SelectItem value="IZIN">Izin</SelectItem>
                  <SelectItem value="OFF_DAY">Cuti</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {filteredRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Tidak ada permohonan yang menunggu persetujuan
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Jenis</TableHead>
                    <TableHead>Alasan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>{formatDate(request.requestDate)}</TableCell>
                      <TableCell className="font-medium">
                        {request.userName}
                      </TableCell>
                      <TableCell>
                        {request.leaveType === "IZIN" ? "Izin" : "Cuti"}
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate">
                        {request.reason}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="bg-yellow-100 text-yellow-800 border-yellow-300"
                        >
                          Menunggu
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-green-600 border-green-600 hover:bg-green-50"
                            onClick={() => handleApprove(request)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Setujui
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-600 hover:bg-red-50"
                            onClick={() => handleReject(request)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Tolak
                          </Button>
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

      {/* Confirmation Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve"
                ? "Setujui Permohonan"
                : "Tolak Permohonan"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve"
                ? "Apakah Anda yakin ingin menyetujui permohonan ini?"
                : "Apakah Anda yakin ingin menolak permohonan ini?"}
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="py-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="font-semibold">Nama:</div>
                <div>{selectedRequest.userName}</div>

                <div className="font-semibold">Tanggal:</div>
                <div>{formatDate(selectedRequest.requestDate)}</div>

                <div className="font-semibold">Jenis:</div>
                <div>
                  {selectedRequest.leaveType === "IZIN" ? "Izin" : "Cuti"}
                </div>

                <div className="font-semibold">Alasan:</div>
                <div>{selectedRequest.reason}</div>
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isProcessing}
            >
              Batal
            </Button>
            <Button
              variant={actionType === "approve" ? "default" : "destructive"}
              onClick={confirmAction}
              disabled={isProcessing}
            >
              {isProcessing
                ? "Memproses..."
                : actionType === "approve"
                ? "Setujui"
                : "Tolak"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
