"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Search, Filter, Download, Calendar } from "lucide-react";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { id } from "date-fns/locale";

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

interface DateRange {
  from: Date | undefined;
  to?: Date | undefined;
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

export default function ReportsPage() {
  const router = useRouter();
  const [allRequests, setAllRequests] = useState<LeaveRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [currentOutletId, setCurrentOutletId] = useState<number | null>(null);
  const [outletName, setOutletName] = useState<string>("");
  // const [rawData, setRawData] = useState<any>(null) // For debugging

  // Fix for the date range issue - explicitly define the type
  const [dateRange, setDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined,
  });

  useEffect(() => {
    const fetchAllRequests = async () => {
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

        // Fetch ALL leave requests
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
          throw new Error(`Error fetching all requests: ${response.status}`);
        }

        const result = await response.json();
        console.log("Raw API response:", result); // Debug log
        // setRawData(result) // Store raw data for debugging

        const allRequestsData = result.data || [];

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

        // Filter requests by outlet ID
        let filteredByOutlet = allRequestsData;
        if (currentOutletId) {
          filteredByOutlet = allRequestsData.filter(
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

        setAllRequests(filteredByOutlet);
        setFilteredRequests(filteredByOutlet);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
        console.error("Error fetching all requests:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllRequests();
  }, [router, currentOutletId]);

  // Apply filters and search
  useEffect(() => {
    let results = allRequests;

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

    // Apply status filter
    if (filterStatus !== "all") {
      results = results.filter((req) => req.status === filterStatus);
    }

    // Apply date range filter
    if (dateRange.from) {
      const fromDate = new Date(dateRange.from);
      fromDate.setHours(0, 0, 0, 0); // Start of day

      results = results.filter((req) => {
        const requestDate = new Date(req.requestDate);
        requestDate.setHours(0, 0, 0, 0); // Start of day for comparison

        if (dateRange.to) {
          const toDate = new Date(dateRange.to);
          toDate.setHours(23, 59, 59, 999); // End of day
          return requestDate >= fromDate && requestDate <= toDate;
        }
        return requestDate >= fromDate;
      });
    }

    setFilteredRequests(results);
  }, [searchTerm, filterType, filterStatus, dateRange, allRequests]);

  // Format date for display
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString("id-ID", options);
  };

  // Safe format function that handles locale issues
  const formatDateWithLocale = (date: Date | undefined) => {
    if (!date) return "";

    try {
      return format(date, "dd MMMM yyyy", { locale: id });
    } catch (error) {
      console.error("Error formatting date:", error);
      // Fallback to simple date format without locale
      return date.toLocaleDateString("id-ID", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
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

  // Export to CSV
  const exportToCSV = () => {
    // Create CSV content
    const headers = ["Tanggal", "Nama", "Jenis", "Alasan", "Status"];
    const csvContent = [
      headers.join(","),
      ...filteredRequests.map((req) =>
        [
          formatDate(req.requestDate),
          req.userName,
          req.leaveType === "IZIN" ? "Izin" : "Cuti",
          `"${req.reason.replace(/"/g, '""')}"`, // Escape quotes in CSV
          req.status,
        ].join(",")
      ),
    ].join("\n");

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `laporan-izin-cuti-${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
              // console.log("Raw data:", rawData)
              console.log("Current outlet ID:", currentOutletId);
              console.log("All requests:", allRequests);
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
            <h1 className="text-2xl font-bold">Laporan Izin/Cuti</h1>
            {outletName && (
              <p className="text-sm text-muted-foreground">
                Outlet: {outletName}
              </p>
            )}
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Semua Permohonan</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={exportToCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3 mb-6">
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

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <SelectValue placeholder="Filter status" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="PENDING">Menunggu</SelectItem>
                  <SelectItem value="APPROVED">Disetujui</SelectItem>
                  <SelectItem value="REJECTED">Ditolak</SelectItem>
                  <SelectItem value="CANCELED">Dibatalkan</SelectItem>
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[250px] justify-start">
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {formatDateWithLocale(dateRange.from)} -{" "}
                          {formatDateWithLocale(dateRange.to)}
                        </>
                      ) : (
                        formatDateWithLocale(dateRange.from)
                      )
                    ) : (
                      <span>Pilih rentang tanggal</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={dateRange}
                    onSelect={(range: DateRange | undefined) => {
                      setDateRange(range || { from: undefined, to: undefined });
                    }}
                    numberOfMonths={2}
                  />
                  <div className="flex items-center justify-end gap-2 p-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setDateRange({ from: undefined, to: undefined })
                      }
                    >
                      Reset
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {filteredRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Tidak ada permohonan yang ditemukan
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
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
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
