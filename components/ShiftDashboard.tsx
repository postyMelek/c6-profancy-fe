"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Clock,
  Users,
  Store,
  FileText,
  CalendarDays,
} from "lucide-react";
import { Bar, Doughnut } from "react-chartjs-2";
import "chart.js/auto";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { id } from "date-fns/locale";

// --- Interface untuk tipe data ShiftData
interface ShiftData {
  totalOutlets: number;
  totalEmployees: number;
  activeShifts: number;
  shiftTypes: number;
  staffByOutlet: { outlet: string; count: number }[];
  shiftTypeDistribution: { type: string; count: number }[];
  activeShiftsByOutlet: { outlet: string; count: number }[];
  outletDetails: {
    name: string;
    staffCount: number;
    activeShifts: number;
  }[];
  scheduleData: {
    date: string;
    shifts: {
      outlet: string;
      employeeName: string;
      employeeInitial: string;
      shiftType: string;
      shiftTime: string;
      status: "active" | "upcoming" | "completed";
    }[];
  }[];
}

// --- Komponen utama
export default function ShiftDashboard() {
  const [data, setData] = useState<ShiftData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Token tidak ditemukan. Silakan login ulang.");
        }

        const response = await fetch(
          "http://localhost:8080/api/shift/dashboard",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log("Shift Dashboard Data:", result);
        setData(result);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Gagal mengambil data dashboard shift."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // --- Mock data untuk development
  const mockData: ShiftData = {
    // (mock data kamu yang tadi, copy-paste aja dari kode kamu yang panjang itu)
    totalOutlets: 4,
    totalEmployees: 45,
    activeShifts: 30,
    shiftTypes: 2,
    staffByOutlet: [
      { outlet: "Margonda", count: 12 },
      { outlet: "Pamulang", count: 8 },
      { outlet: "Kemang", count: 10 },
      { outlet: "Bekasi", count: 15 },
    ],
    shiftTypeDistribution: [
      { type: "Opening", count: 18 },
      { type: "Closing", count: 12 },
    ],
    activeShiftsByOutlet: [
      { outlet: "Margonda", count: 8 },
      { outlet: "Pamulang", count: 5 },
      { outlet: "Kemang", count: 7 },
      { outlet: "Bekasi", count: 10 },
    ],
    outletDetails: [
      { name: "Margonda", staffCount: 12, activeShifts: 8 },
      { name: "Pamulang", staffCount: 8, activeShifts: 5 },
      { name: "Kemang", staffCount: 10, activeShifts: 7 },
      { name: "Bekasi", staffCount: 15, activeShifts: 10 },
    ],
    scheduleData: [
      {
        date: "2025-03-03",
        shifts: [
          {
            outlet: "Margonda",
            employeeName: "Ghania",
            employeeInitial: "G",
            shiftType: "Opening",
            shiftTime: "08:00-17:00",
            status: "active",
          },
          {
            outlet: "Margonda",
            employeeName: "Rizky",
            employeeInitial: "R",
            shiftType: "Opening",
            shiftTime: "08:00-17:00",
            status: "active",
          },
          {
            outlet: "Pamulang",
            employeeName: "Ghania",
            employeeInitial: "G",
            shiftType: "Opening",
            shiftTime: "08:00-17:00",
            status: "active",
          },
          {
            outlet: "Bekasi",
            employeeName: "Putri",
            employeeInitial: "P",
            shiftType: "Closing",
            shiftTime: "15:00-00:00",
            status: "active",
          },
        ],
      },
      {
        date: "2025-03-04",
        shifts: [
          {
            outlet: "Margonda",
            employeeName: "Ghania",
            employeeInitial: "G",
            shiftType: "Opening",
            shiftTime: "08:00-17:00",
            status: "upcoming",
          },
          {
            outlet: "Bekasi",
            employeeName: "Dimas",
            employeeInitial: "D",
            shiftType: "Closing",
            shiftTime: "15:00-00:00",
            status: "upcoming",
          },
          {
            outlet: "Pamulang",
            employeeName: "Putri",
            employeeInitial: "P",
            shiftType: "Opening",
            shiftTime: "08:00-17:00",
            status: "upcoming",
          },
        ],
      },
    ],
  };

  const displayData = data || mockData;

  // --- Sisa kode render yang panjang (semua return jsx yang sudah kamu buat)
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center p-6 bg-red-50 rounded-lg max-w-md">
          <h3 className="text-red-600 font-semibold text-lg mb-2">Error</h3>
          <p className="text-gray-700">{error}</p>
          <Button className="mt-4" onClick={() => window.location.reload()}>
            Coba Lagi
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* --- Semua tampilan dashboard kamu tadi di sini */}
      {/* mulai dari header, cards, tabs, chartjs2, table, dst */}
      {/* (copy paste bagian return <div>...</div> dari kode awal kamu) */}
    </div>
  );
}
