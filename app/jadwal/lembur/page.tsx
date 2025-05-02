"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Search, SlidersHorizontal, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

interface OvertimeLog {
  id: number;
  baristaId: number;
  userId: string;
  outletId: number;
  dateOvertime: string;
  startHour: string;
  duration: string;
  reason: string;
  status: string;
  statusDisplay: string;
  verifier: string | null;
  outletName: string;
  createdAt: string;
  updatedAt: string;
}

interface Outlet {
  outletId: number;
  name: string;
  headBarName: string;
  headBarId: string;
}

export default function OvertimeLogList() {
  const [overtimeLogs, setOvertimeLogs] = useState<OvertimeLog[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedSort, setSelectedSort] = useState<string>("tanggal-desc");

  const [showSort, setShowSort] = useState(false);
  const [showFilter, setShowFilter] = useState(false);

  useEffect(() => {
    fetchOvertimeLogs();
    fetchOutlets();
  }, []);

  const fetchOvertimeLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("Token not found");
        setLoading(false);
        return;
      }

      const response = await fetch("http://localhost:8080/api/overtime-logs", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch overtime logs");

      const data = await response.json();
      setOvertimeLogs(data);
    } catch (error) {
      console.error("Error fetching overtime logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOutlets = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("Token not found");
        return;
      }

      const response = await fetch("http://localhost:8080/api/outlets", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch outlets");

      const data = await response.json();
      console.log("🟢 Outlets data:", data);
      setOutlets(data);
    } catch (error) {
      console.error("Error fetching outlets:", error);
    }
  };

  const getVerifierName = (log: OvertimeLog) => {
    if (log.verifier && log.verifier.trim() !== "") {
      return log.verifier;
    }

    const outlet = outlets.find((o) => o.outletId === log.outletId);
    return outlet?.headBarName || "-";
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Filter and Sort Logic
  let filteredLogs = overtimeLogs.filter(
    (log) =>
      log.outletName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (selectedStatus !== "ALL") {
    filteredLogs = filteredLogs.filter((log) => log.status === selectedStatus);
  }

  filteredLogs.sort((a, b) => {
    if (selectedSort === "tanggal-asc") {
      return (
        new Date(a.dateOvertime).getTime() - new Date(b.dateOvertime).getTime()
      );
    } else if (selectedSort === "tanggal-desc") {
      return (
        new Date(b.dateOvertime).getTime() - new Date(a.dateOvertime).getTime()
      );
    } else if (selectedSort === "durasi-asc") {
      return (
        parseInt(a.duration.split(":")[0]) - parseInt(b.duration.split(":")[0])
      );
    } else if (selectedSort === "durasi-desc") {
      return (
        parseInt(b.duration.split(":")[0]) - parseInt(a.duration.split(":")[0])
      );
    }
    return 0;
  });

  const getStatusClass = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "text-green-600";
      case "REJECTED":
        return "text-red-600";
      case "PENDING":
        return "text-yellow-600";
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
      default:
        return status;
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col items-center justify-between mb-6 md:flex-row">
        <div>
          <h1 className="text-2xl font-bold text-[#4169E1]">Log Lembur Saya</h1>
        </div>

        <Link href="/jadwal/lembur/create">
          <Button className="rounded-full">
            <Plus className="mr-2 h-5 w-5" />
            Tambah Log Lembur
          </Button>
        </Link>
      </div>

      {/* Search & Filter */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={18}
          />
          <Input
            placeholder="Search by outlet or reason..."
            className="pl-10 w-full"
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>

        <div className="flex gap-2">
          {/* SORT */}
          <div className="relative">
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => {
                setShowSort(!showSort);
                setShowFilter(false);
              }}
            >
              <SlidersHorizontal size={16} />
              <span>Sort</span>
            </Button>
            {showSort && (
              <div className="absolute right-0 mt-2 w-40 bg-white shadow-md rounded border z-10">
                <button
                  className={`block w-full text-left px-4 py-2 hover:bg-gray-100 ${
                    selectedSort === "tanggal-asc" ? "bg-gray-100" : ""
                  }`}
                  onClick={() => setSelectedSort("tanggal-asc")}
                >
                  Tanggal ↑
                </button>
                <button
                  className={`block w-full text-left px-4 py-2 hover:bg-gray-100 ${
                    selectedSort === "tanggal-desc" ? "bg-gray-100" : ""
                  }`}
                  onClick={() => setSelectedSort("tanggal-desc")}
                >
                  Tanggal ↓
                </button>
                <button
                  className={`block w-full text-left px-4 py-2 hover:bg-gray-100 ${
                    selectedSort === "durasi-asc" ? "bg-gray-100" : ""
                  }`}
                  onClick={() => setSelectedSort("durasi-asc")}
                >
                  Durasi ↑
                </button>
                <button
                  className={`block w-full text-left px-4 py-2 hover:bg-gray-100 ${
                    selectedSort === "durasi-desc" ? "bg-gray-100" : ""
                  }`}
                  onClick={() => setSelectedSort("durasi-desc")}
                >
                  Durasi ↓
                </button>
              </div>
            )}
          </div>

          {/* FILTER */}
          <div className="relative">
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => {
                setShowFilter(!showFilter);
                setShowSort(false);
              }}
            >
              <SlidersHorizontal size={16} />
              <span>Filter</span>
            </Button>
            {showFilter && (
              <div className="absolute right-0 mt-2 w-40 bg-white shadow-md rounded border z-10">
                <button
                  className={`block w-full text-left px-4 py-2 hover:bg-gray-100 ${
                    selectedStatus === "ALL" ? "bg-gray-100" : ""
                  }`}
                  onClick={() => setSelectedStatus("ALL")}
                >
                  Semua Status
                </button>
                <button
                  className={`block w-full text-left px-4 py-2 hover:bg-gray-100 ${
                    selectedStatus === "APPROVED" ? "bg-gray-100" : ""
                  }`}
                  onClick={() => setSelectedStatus("APPROVED")}
                >
                  Diterima
                </button>
                <button
                  className={`block w-full text-left px-4 py-2 hover:bg-gray-100 ${
                    selectedStatus === "REJECTED" ? "bg-gray-100" : ""
                  }`}
                  onClick={() => setSelectedStatus("REJECTED")}
                >
                  Ditolak
                </button>
                <button
                  className={`block w-full text-left px-4 py-2 hover:bg-gray-100 ${
                    selectedStatus === "PENDING" ? "bg-gray-100" : ""
                  }`}
                  onClick={() => setSelectedStatus("PENDING")}
                >
                  Menunggu Konfirmasi
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#4169E1] text-white">
              <th className="px-4 py-3 text-left">Tanggal Lembur</th>
              <th className="px-4 py-3 text-left">Jam Mulai</th>
              <th className="px-4 py-3 text-left">Outlet</th>
              <th className="px-4 py-3 text-left">Durasi</th>
              <th className="px-4 py-3 text-left">Alasan Lembur</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Verifikator</th>
              <th className="px-4 py-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-3 text-center">
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#4169E1]"></div>
                  </div>
                </td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-3 text-center">
                  Tidak ada data lembur ditemukan
                </td>
              </tr>
            ) : (
              filteredLogs.map((log, index) => (
                <tr
                  key={log.id}
                  className={`border-b border-gray-200 ${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                  }`}
                >
                  <td className="px-4 py-3">
                    {new Date(log.dateOvertime).toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3">{log.startHour.substring(0, 5)}</td>
                  <td className="px-4 py-3">{log.outletName}</td>
                  <td className="px-4 py-3">
                    {log.duration.split(":")[0]} jam
                  </td>
                  <td className="px-4 py-3">{log.reason}</td>
                  <td className={`px-4 py-3 ${getStatusClass(log.status)}`}>
                    {getStatusDisplay(log.status)}
                  </td>
                  <td className="px-4 py-3">{getVerifierName(log)}</td>
                  <td className="px-4 py-3">
                    <Link href={`/jadwal/lembur/${log.id}`}>
                      <Button
                        className="bg-[#4169E1] hover:bg-[#3a5ecc]"
                        size="sm"
                      >
                        Detail
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
