"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, Clock, Users, Store, CalendarDays, RefreshCw } from "lucide-react"
import { Bar, Doughnut } from "react-chartjs-2"
import "chart.js/auto"
import { Badge } from "@/components/ui/badge"
import { format, isAfter, isBefore, isEqual, parseISO, startOfDay, startOfWeek, endOfWeek, addWeeks } from "date-fns"
import { id } from "date-fns/locale"
import Calendar from "react-calendar"
import "react-calendar/dist/Calendar.css"

interface ShiftData {
  totalOutlets: number
  totalEmployees: number
  activeShifts: number
  shiftTypes: number
  staffByOutlet: { outlet: string; count: number }[]
  shiftTypeDistribution: { type: string; count: number }[]
  activeShiftsByOutlet: { outlet: string; count: number }[]
  outletDetails: {
    name: string
    staffCount: number
    activeShifts: number
  }[]
  scheduleData: {
    date: string
    shifts: {
      outlet: string
      employeeName: string
      employeeInitial: string
      shiftType: string
      shiftTime: string
      status: "active" | "upcoming" | "completed"
    }[]
  }[]
}

export default function ShiftDashboard() {
  const [data, setData] = useState<ShiftData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [userRole, setUserRole] = useState<string>("")
  const [isLoadingUser, setIsLoadingUser] = useState<boolean>(true)

  // State untuk filter
  const [dateFilter, setDateFilter] = useState("all-dates")
  const [outletFilter, setOutletFilter] = useState("all-outlets")
  const [filteredScheduleData, setFilteredScheduleData] = useState<ShiftData["scheduleData"]>([])

  // State untuk calendar view
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list")
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [formattedDate, setFormattedDate] = useState("")
  const [selectedDateShifts, setSelectedDateShifts] = useState<ShiftData["scheduleData"][0]["shifts"]>([])

  // Fetch user data to check role
  useEffect(() => {
    const fetchUser = async () => {
      const username = localStorage.getItem("username")
      const token = localStorage.getItem("token")

      if (!username || !token) {
        alert("User belum login atau token tidak ditemukan.")
        setIsLoadingUser(false)
        return
      }

      try {
        const res = await fetch(`http://localhost:8080/api/account/${username}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        const json = await res.json()
        const role = json?.data?.role || ""
        setUserRole(role)
      } catch (err) {
        console.error("❌ Gagal mengambil data user:", err)
      } finally {
        setIsLoadingUser(false)
      }
    }

    fetchUser()
  }, [])

  const fetchDashboardData = async () => {
    if (!["CEO", "CMO", "CIOO", "Admin"].includes(userRole)) return

    setIsLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("Token tidak ditemukan. Silakan login ulang.")
      }

      const response = await fetch("http://localhost:8080/api/shift/dashboard", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      console.log("Shift Dashboard Data:", result)

      // Validasi struktur data
      const validatedData = {
        totalOutlets: result.totalOutlets || 0,
        totalEmployees: result.totalEmployees || 0,
        activeShifts: result.activeShifts || 0,
        shiftTypes: result.shiftTypes || 0,
        staffByOutlet: result.staffByOutlet || [],
        shiftTypeDistribution: result.shiftTypeDistribution || [],
        activeShiftsByOutlet: result.activeShiftsByOutlet || [],
        outletDetails: result.outletDetails || [],
        scheduleData: result.scheduleData || [],
      }

      setData(validatedData)
      // Set filtered data awal sama dengan semua data
      setFilteredScheduleData(validatedData.scheduleData || [])
    } catch (err) {
      console.error("Error fetching dashboard data:", err)
      setError(err instanceof Error ? err.message : "Gagal mengambil data dashboard shift.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [userRole])

  // Effect untuk memfilter data saat filter berubah
  useEffect(() => {
    if (!data) return

    let filtered = [...data.scheduleData]
    const today = startOfDay(new Date())

    // Filter berdasarkan tanggal
    if (dateFilter !== "all-dates") {
      filtered = filtered.filter((item) => {
        const itemDate = parseISO(item.date)

        if (dateFilter === "today") {
          return isEqual(startOfDay(itemDate), today)
        } else if (dateFilter === "this-week") {
          const weekStart = startOfWeek(today, { weekStartsOn: 1 })
          const weekEnd = endOfWeek(today, { weekStartsOn: 1 })
          return !isBefore(itemDate, weekStart) && !isAfter(itemDate, weekEnd)
        } else if (dateFilter === "next-week") {
          const nextWeekStart = startOfWeek(addWeeks(today, 1), {
            weekStartsOn: 1,
          })
          const nextWeekEnd = endOfWeek(addWeeks(today, 1), {
            weekStartsOn: 1,
          })
          return !isBefore(itemDate, nextWeekStart) && !isAfter(itemDate, nextWeekEnd)
        }
        return true
      })
    }

    // Filter berdasarkan outlet
    if (outletFilter !== "all-outlets") {
      filtered = filtered
        .map((day) => ({
          ...day,
          shifts: day.shifts.filter((shift) => shift.outlet.toLowerCase() === outletFilter.toLowerCase()),
        }))
        .filter((day) => day.shifts.length > 0) // Hapus hari tanpa shift
    }

    setFilteredScheduleData(filtered)
  }, [dateFilter, outletFilter, data])

  // Effect untuk update shifts berdasarkan tanggal yang dipilih di calendar view
  useEffect(() => {
    if (!filteredScheduleData || filteredScheduleData.length === 0) {
      setSelectedDateShifts([])
      return
    }

    const selectedDateStr = format(selectedDate, "yyyy-MM-dd")
    const dayData = filteredScheduleData.find((day) => {
      const dayDate = day.date.split("T")[0] // Handle ISO date format
      return dayDate === selectedDateStr
    })

    setSelectedDateShifts(dayData?.shifts || [])

    // Format tanggal untuk ditampilkan
    const newDate = selectedDate.toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
    setFormattedDate(newDate)
  }, [selectedDate, filteredScheduleData])

  // Mock data for development/preview
  const mockData: ShiftData = {
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
  }

  // Use mock data if real data is not available yet
  const displayData = data || mockData

  // Pastikan displayData memiliki struktur yang benar
  const safeDisplayData = {
    totalOutlets: displayData?.totalOutlets || 0,
    totalEmployees: displayData?.totalEmployees || 0,
    activeShifts: displayData?.activeShifts || 0,
    shiftTypes: displayData?.shiftTypes || 0,
    staffByOutlet: displayData?.staffByOutlet || [],
    shiftTypeDistribution: displayData?.shiftTypeDistribution || [],
    activeShiftsByOutlet: displayData?.activeShiftsByOutlet || [],
    outletDetails: displayData?.outletDetails || [],
    scheduleData: displayData?.scheduleData || [],
  }

  // Function to group shifts by type (Opening/Closing)
  const groupShiftsByType = (shifts: ShiftData["scheduleData"][0]["shifts"]) => {
    const openingShifts = shifts.filter((shift) => shift.shiftType === "Opening")
    const closingShifts = shifts.filter((shift) => shift.shiftType === "Closing")
    return { openingShifts, closingShifts }
  }

  // Function to check if a date has shifts
  const hasShiftsOnDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd")
    return filteredScheduleData.some((day) => {
      const dayDate = day.date.split("T")[0]
      return dayDate === dateStr && day.shifts.length > 0
    })
  }

  if (isLoadingUser) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Loading user data...</p>
        </div>
      </div>
    )
  }

  if (!["CEO", "CMO", "CIOO", "Admin"].includes(userRole)) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h2 className="text-xl font-semibold text-red-600 mb-2">Access Denied</h2>
        <p className="text-gray-600">You don't have permission to view this dashboard.</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Loading dashboard data...</p>
        </div>
      </div>
    )
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
    )
  }

  return (
    <div className="p-6">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#5b5fc7]">Shift Management Overview</h1>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2" onClick={fetchDashboardData}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          {/* <Button variant="outline" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Export
          </Button>
          <Button className="bg-[#5b5fc7] hover:bg-[#4a4db3] flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            Schedule Shift
          </Button> */}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Outlets</p>
                <h3 className="text-3xl font-bold text-[#5b5fc7]">{safeDisplayData.totalOutlets}</h3>
                <p className="text-xs text-gray-400 mt-1">Active outlets across regions</p>
              </div>
              <div className="bg-blue-100 p-2 rounded-full">
                <Store className="h-5 w-5 text-[#5b5fc7]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Employees</p>
                <h3 className="text-3xl font-bold text-green-600">{safeDisplayData.totalEmployees}</h3>
                <p className="text-xs text-gray-400 mt-1">Across all outlets</p>
              </div>
              <div className="bg-green-100 p-2 rounded-full">
                <Users className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500 mb-1">Active Shifts</p>
                <h3 className="text-3xl font-bold text-purple-600">{safeDisplayData.activeShifts}</h3>
                <p className="text-xs text-gray-400 mt-1">Currently scheduled</p>
              </div>
              <div className="bg-purple-100 p-2 rounded-full">
                <CalendarDays className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500 mb-1">Shift Types</p>
                <h3 className="text-3xl font-bold text-amber-500">{safeDisplayData.shiftTypes}</h3>
                <p className="text-xs text-gray-400 mt-1">Opening, Closing</p>
              </div>
              <div className="bg-amber-100 p-2 rounded-full">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="mb-6" onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-gray-500" />
                  Staff by Outlet
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    Distribution of employees across all outlets
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <Bar
                  data={{
                    labels: safeDisplayData.staffByOutlet?.map((item) => item.outlet) || [],
                    datasets: [
                      {
                        label: "Employees",
                        data: safeDisplayData.staffByOutlet?.map((item) => item.count) || [],
                        backgroundColor: "#6366F1",
                        borderRadius: 4,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          precision: 0,
                        },
                      },
                    },
                  }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-gray-500" />
                  Shift Type Distribution
                  <span className="text-sm font-normal text-gray-500 ml-2">Opening vs Closing shifts</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center">
                <div style={{ width: "70%", height: "70%" }}>
                  <Doughnut
                    data={{
                      labels: safeDisplayData.shiftTypeDistribution?.map((s) => s.type) || [],
                      datasets: [
                        {
                          data: safeDisplayData.shiftTypeDistribution?.map((s) => s.count) || [],
                          backgroundColor: ["#6366F1", "#EF4444"],
                          borderWidth: 0,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      cutout: "70%",
                      plugins: {
                        legend: {
                          position: "bottom",
                        },
                      },
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-gray-500" />
                  Active Shifts by Outlet
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    Current shift allocation across outlets
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[250px]">
                <Bar
                  data={{
                    labels: safeDisplayData.activeShiftsByOutlet?.map((item) => item.outlet) || [],
                    datasets: [
                      {
                        label: "Active Shifts",
                        data: safeDisplayData.activeShiftsByOutlet?.map((item) => item.count) || [],
                        backgroundColor: "#4ADE80",
                        borderRadius: 4,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          precision: 0,
                        },
                      },
                    },
                  }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Store className="h-5 w-5 text-gray-500" />
                  Outlet Overview
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    Staff and active shifts across all outlets
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {(safeDisplayData.outletDetails || []).map((outlet) => (
                    <Card key={outlet.name} className="bg-gray-50">
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-md">{outlet.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">Staff:</span>
                          <span className="font-semibold">{outlet.staffCount}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">Active Shifts:</span>
                          <span className="font-semibold">{outlet.activeShifts}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-gray-500" />
                  Schedule Overview
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    Monitor work schedules across all outlets
                  </span>
                </div>
                <div className="flex gap-2">
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="All Dates" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-dates">All Dates</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="this-week">This Week</SelectItem>
                      <SelectItem value="next-week">Next Week</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={outletFilter} onValueChange={setOutletFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="All Outlets" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-outlets">All Outlets</SelectItem>
                      {(safeDisplayData.staffByOutlet || []).map((outlet) => (
                        <SelectItem key={outlet.outlet} value={outlet.outlet.toLowerCase()}>
                          {outlet.outlet}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  className={viewMode === "list" ? "bg-[#5b5fc7]" : "bg-white"}
                  onClick={() => setViewMode("list")}
                >
                  List View
                </Button>
                <Button
                  variant={viewMode === "calendar" ? "default" : "outline"}
                  className={viewMode === "calendar" ? "bg-[#5b5fc7]" : "bg-gray-100"}
                  onClick={() => setViewMode("calendar")}
                >
                  Calendar View
                </Button>
              </div>

              {viewMode === "list" ? (
                // List View
                filteredScheduleData.length > 0 ? (
                  filteredScheduleData.map((daySchedule) => (
                    <div key={daySchedule.date} className="mb-6">
                      <div className="flex items-center gap-2 mb-2">
                        <CalendarIcon className="h-5 w-5 text-blue-600" />
                        <h3 className="text-md font-medium">
                          {format(parseISO(daySchedule.date), "EEEE, d MMMM yyyy", { locale: id })}
                        </h3>
                      </div>

                      <div className="bg-white rounded-lg overflow-hidden border">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-[#5b5fc7] text-white">
                            <tr>
                              <th className="px-6 py-3 text-left text-sm font-medium">Outlet</th>
                              <th className="px-6 py-3 text-left text-sm font-medium">Nama Lengkap</th>
                              <th className="px-6 py-3 text-left text-sm font-medium">Shift</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {(daySchedule.shifts || []).map((shift, idx) => (
                              <tr key={idx}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">{shift.outlet}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-[#5b5fc7] text-white flex items-center justify-center text-xs">
                                      {shift.employeeInitial}
                                    </div>
                                    {shift.employeeName}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  <div className="flex items-center gap-2">
                                    <span>
                                      {shift.shiftType} ({shift.shiftTime})
                                    </span>
                                    <Badge
                                      className={
                                        shift.status === "active"
                                          ? "bg-green-100 text-green-800 hover:bg-green-100"
                                          : shift.status === "upcoming"
                                            ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                                            : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                                      }
                                    >
                                      {shift.status === "active"
                                        ? "Active"
                                        : shift.status === "upcoming"
                                          ? "Upcoming"
                                          : "Completed"}
                                    </Badge>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 border rounded-lg bg-white">
                    <p className="text-gray-500">Tidak ada jadwal shift yang sesuai dengan filter.</p>
                  </div>
                )
              ) : (
                // Calendar View
                <div
                  className="flex flex-col md:flex-row justify-center items-center gap-[10px] w-full rounded-[20px] shadow-md bg-[#EDF1FF]"
                  style={{ padding: "28px 40px", alignSelf: "stretch" }}
                >
                  <div className="flex flex-col items-center">
                    <Calendar
                      onChange={(value) => setSelectedDate(value as Date)}
                      value={selectedDate}
                      className="react-calendar"
                      tileClassName={({ date }) => {
                        if (date.toDateString() === new Date().toDateString()) {
                          return "selected-tile"
                        }
                        if (hasShiftsOnDate(date)) {
                          return "has-shifts"
                        }
                        return ""
                      }}
                    />
                  </div>

                  <div className="jadwal-shift bg-white pt-0 px-0 pb-6 rounded-lg shadow-md w-full max-w-md overflow-hidden">
                    {formattedDate && (
                      <div className="bg-[#5171E3] text-white text-center w-full py-3 rounded-t-lg">
                        <h3 className="text-lg font-semibold">{formattedDate}</h3>
                      </div>
                    )}

                    <div className="px-6 mt-4">
                      {selectedDateShifts.length > 0 ? (
                        <>
                          {/* Shift Pagi (Opening) */}
                          <div className="mb-6">
                            <h4
                              className="text-md font-semibold mb-4 px-4 py-2 text-center mx-auto"
                              style={{
                                borderRadius: "24px",
                                border: "2px solid #D5DEFF",
                                color: "#5171E3",
                                width: "fit-content",
                                fontFamily: "Inter",
                                backgroundColor: "#ffffff",
                              }}
                            >
                              Shift Pagi
                            </h4>

                            {groupShiftsByType(selectedDateShifts).openingShifts.length > 0 ? (
                              <div className="space-y-2">
                                {groupShiftsByType(selectedDateShifts).openingShifts.map((shift, index) => (
                                  <div key={index} className="flex items-center gap-2 p-2 bg-[#EFF2FF] rounded-md">
                                    <div className="w-8 h-8 rounded-full bg-[#5171E3] text-white flex items-center justify-center">
                                      {shift.employeeInitial}
                                    </div>
                                    <div className="flex-1">
                                      <p className="font-medium">{shift.employeeName}</p>
                                      <p className="text-sm text-gray-600">
                                        {shift.outlet} • {shift.shiftTime}
                                      </p>
                                    </div>
                                    <Badge
                                      className={
                                        shift.status === "active"
                                          ? "bg-green-100 text-green-800"
                                          : shift.status === "upcoming"
                                            ? "bg-blue-100 text-blue-800"
                                            : "bg-gray-100 text-gray-800"
                                      }
                                    >
                                      {shift.status === "active"
                                        ? "Active"
                                        : shift.status === "upcoming"
                                          ? "Upcoming"
                                          : "Completed"}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-gray-500 text-center">Tidak ada barista di shift pagi.</p>
                            )}
                          </div>

                          {/* Shift Sore (Closing) */}
                          <div className="mb-6">
                            <h4
                              className="text-md font-semibold mb-4 px-4 py-2 text-center mx-auto"
                              style={{
                                borderRadius: "24px",
                                border: "2px solid #D5DEFF",
                                color: "#5171E3",
                                width: "fit-content",
                                fontFamily: "Inter",
                                backgroundColor: "#ffffff",
                              }}
                            >
                              Shift Sore
                            </h4>

                            {groupShiftsByType(selectedDateShifts).closingShifts.length > 0 ? (
                              <div className="space-y-2">
                                {groupShiftsByType(selectedDateShifts).closingShifts.map((shift, index) => (
                                  <div key={index} className="flex items-center gap-2 p-2 bg-[#EFF2FF] rounded-md">
                                    <div className="w-8 h-8 rounded-full bg-[#5171E3] text-white flex items-center justify-center">
                                      {shift.employeeInitial}
                                    </div>
                                    <div className="flex-1">
                                      <p className="font-medium">{shift.employeeName}</p>
                                      <p className="text-sm text-gray-600">
                                        {shift.outlet} • {shift.shiftTime}
                                      </p>
                                    </div>
                                    <Badge
                                      className={
                                        shift.status === "active"
                                          ? "bg-green-100 text-green-800"
                                          : shift.status === "upcoming"
                                            ? "bg-blue-100 text-blue-800"
                                            : "bg-gray-100 text-gray-800"
                                      }
                                    >
                                      {shift.status === "active"
                                        ? "Active"
                                        : shift.status === "upcoming"
                                          ? "Upcoming"
                                          : "Completed"}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-gray-500 text-center">Tidak ada barista di shift sore.</p>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="py-10 text-center">
                          <p className="text-gray-500">Tidak ada jadwal shift untuk tanggal ini.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
