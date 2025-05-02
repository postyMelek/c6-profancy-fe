"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Bar, Pie } from "react-chartjs-2";
import "chart.js/auto";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search, Users, UserCheck, UserX, Store } from "lucide-react";

interface BaristaData {
  total: number;
  active: number;
  inactive: number;
  outlets: number;
  outletStats: { name: string; count: number }[];
  roleStats: { name: string; count: number }[];
  statusStats: { status: string; count: number }[];
}

interface BaristaAll {
  id: string;
  fullName: string;
  role: string;
  outlet: string;
  status: string;
  contact?: string;
}

export default function BaristaDashboard() {
  const [data, setData] = useState<BaristaData | null>(null);
  const [outletCount, setOutletCount] = useState<number>(0);
  const [allBaristas, setAllBaristas] = useState<BaristaAll[]>([]);
  const [activeTab, setActiveTab] = useState<string>("analytics");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("");
  const [isLoadingUser, setIsLoadingUser] = useState<boolean>(true);

  useEffect(() => {
    const fetchUser = async () => {
      const username = localStorage.getItem("username");
      const token = localStorage.getItem("token");

      if (!username || !token) {
        alert("User belum login atau token tidak ditemukan.");
        setIsLoadingUser(false);
        return;
      }

      try {
        const res = await fetch(
          `http://localhost:8080/api/account/${username}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const json = await res.json();
        const role = json?.data?.role || "";
        setUserRole(role);
      } catch (err) {
        console.error("❌ Gagal mengambil data user:", err);
      } finally {
        setIsLoadingUser(false);
      }
    };

    fetchUser();
  }, []);

  const activeCount = allBaristas.filter(
    (b) =>
      b.status.toLowerCase() === "active" || b.status.toLowerCase() === "aktif"
  ).length;

  const inactiveCount = allBaristas.filter(
    (b) =>
      b.status.toLowerCase() !== "active" && b.status.toLowerCase() !== "aktif"
  ).length;

  useEffect(() => {
    if (!["CEO", "CMO", "CIOO", "Admin"].includes(userRole)) return;

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Token tidak ditemukan. Silakan login ulang.");
      return;
    }

    fetch("http://localhost:8080/api/baristas/stats", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Gagal fetch data barista");
        return res.json();
      })
      .then((data: BaristaData) => {
        console.log("Data dashboard barista:", data);
        setData(data);
      })
      .catch((err) => {
        console.error("Error:", err);
        alert("Gagal mengambil data dashboard barista.");
      });

    fetch("http://localhost:8080/api/outlets", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Gagal fetch data outlet");
        return res.json();
      })
      .then((outlets: any[]) => {
        console.log("Outlets:", outlets);
        setOutletCount(outlets.length);
      })
      .catch((err) => {
        console.error("Error outlet:", err);
      });

    fetch("http://localhost:8080/api/baristas/all", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Gagal fetch semua barista");
        return res.json();
      })
      .then((baristas: BaristaAll[]) => {
        console.log("Semua barista:", baristas);
        setAllBaristas(baristas);
      })
      .catch((err) => {
        console.error("Error ambil semua barista:", err);
      });
  }, [userRole]);

  if (isLoadingUser) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading user data...
      </div>
    );
  }

  if (!["CEO", "CMO", "CIOO", "Admin"].includes(userRole)) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h2 className="text-xl font-semibold text-red-600 mb-2">
          Access Denied
        </h2>
        <p className="text-gray-600">
          You don't have permission to view this dashboard.
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading dashboard data...
      </div>
    );
  }

  const roleTotal = data?.roleStats?.reduce((acc, r) => acc + r.count, 0) || 0;
  const statusTotal =
    data?.statusStats?.reduce((acc, s) => acc + s.count, 0) || 0;

  const predefinedRoles = ["Head Bar", "Barista", "Trainee", "Probation"];
  const roleMap = Object.fromEntries(predefinedRoles.map((role) => [role, 0]));
  data.roleStats.forEach((r) => {
    if (roleMap[r.name] !== undefined) {
      roleMap[r.name] = r.count;
    }
  });

  const filteredBaristas = allBaristas.filter(
    (barista) =>
      barista.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      barista.outlet.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-indigo-600">
          Barista Management Dashboard
        </h1>
        {/* <Button className="bg-indigo-600 hover:bg-indigo-700">
          Generate Report
        </Button> */}
      </div>

      <Tabs defaultValue="analytics" onValueChange={setActiveTab}>
        <TabsList className="mb-6 w-full max-w-md mx-auto grid grid-cols-2">
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="table">Table View</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Total Baristas
                    </p>
                    <h3 className="text-3xl font-bold mt-1">
                      {allBaristas.length}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Across all outlets
                    </p>
                  </div>
                  <div className="bg-indigo-100 p-2 rounded-full">
                    <Users className="h-5 w-5 text-indigo-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Active Baristas
                    </p>
                    <h3 className="text-3xl font-bold mt-1">{activeCount}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {allBaristas.length > 0
                        ? `${((activeCount / allBaristas.length) * 100).toFixed(
                            1
                          )}% of total`
                        : "0% of total"}
                    </p>
                  </div>
                  <div className="bg-green-100 p-2 rounded-full">
                    <UserCheck className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Inactive Baristas
                    </p>
                    <h3 className="text-3xl font-bold mt-1">{inactiveCount}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {allBaristas.length > 0
                        ? `${(
                            (inactiveCount / allBaristas.length) *
                            100
                          ).toFixed(1)}% of total`
                        : "0% of total"}
                    </p>
                  </div>
                  <div className="bg-red-100 p-2 rounded-full">
                    <UserX className="h-5 w-5 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Outlets</p>
                    <h3 className="text-3xl font-bold mt-1">{outletCount}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Active locations
                    </p>
                  </div>
                  <div className="bg-purple-100 p-2 rounded-full">
                    <Store className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-6">
            <Card className="bg-white shadow-sm col-span-1 lg:col-span-1">
              <CardContent className="p-6">
                <h3 className="text-lg font-medium mb-4">Baristas by Outlet</h3>
                <p className="text-xs text-gray-500 mb-4">
                  Distribution across locations
                </p>
                <div className="h-64">
                  <Bar
                    data={{
                      labels: data.outletStats.map((o) => o.name),
                      datasets: [
                        {
                          label: "Baristas",
                          data: data.outletStats.map((o) => o.count),
                          backgroundColor: "rgba(99, 102, 241, 0.8)",
                          borderColor: "rgb(99, 102, 241)",
                          borderWidth: 1,
                        },
                      ],
                    }}
                    options={{
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
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <h3 className="text-lg font-medium mb-4">Baristas by Role</h3>
                <p className="text-xs text-gray-500 mb-4">
                  Staff configuration
                </p>
                <div className="h-64 flex items-center justify-center">
                  <Pie
                    data={{
                      labels: data.roleStats.map((r) => r.name),
                      datasets: [
                        {
                          data: data.roleStats.map((r) => r.count),
                          backgroundColor: [
                            "rgba(99, 102, 241, 0.8)",
                            "rgba(147, 51, 234, 0.7)",
                            "rgba(192, 132, 252, 0.7)",
                            "rgba(216, 180, 254, 0.7)",
                          ],
                          borderColor: [
                            "rgb(99, 102, 241)",
                            "rgb(147, 51, 234)",
                            "rgb(192, 132, 252)",
                            "rgb(216, 180, 254)",
                          ],
                          borderWidth: 1,
                        },
                      ],
                    }}
                    options={{
                      maintainAspectRatio: false,
                      plugins: {
                        tooltip: {
                          callbacks: {
                            label: (context) => {
                              const label = context.label || "";
                              const value = context.raw as number;
                              const percentage =
                                roleTotal > 0
                                  ? ((value / roleTotal) * 100).toFixed(1)
                                  : 0;
                              return `${label}: ${value} (${percentage}%)`;
                            },
                          },
                        },
                      },
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <h3 className="text-lg font-medium mb-4">Baristas by Status</h3>
                <p className="text-xs text-gray-500 mb-4">Active vs inactive</p>
                <div className="h-64 flex items-center justify-center">
                  <Pie
                    data={{
                      labels: ["Aktif", "Nonaktif"],
                      datasets: [
                        {
                          data: [activeCount, inactiveCount],
                          backgroundColor: [
                            "rgba(34, 197, 94, 0.8)",
                            "rgba(239, 68, 68, 0.8)",
                          ],
                          borderColor: ["rgb(34, 197, 94)", "rgb(239, 68, 68)"],
                          borderWidth: 1,
                        },
                      ],
                    }}
                    options={{
                      maintainAspectRatio: false,
                      plugins: {
                        tooltip: {
                          callbacks: {
                            label: (context) => {
                              const label = context.label || "";
                              const value = context.raw as number;
                              const percentage =
                                allBaristas.length > 0
                                  ? (
                                      (value / allBaristas.length) *
                                      100
                                    ).toFixed(1)
                                  : 0;
                              return `${label}: ${value} (${percentage}%)`;
                            },
                          },
                        },
                      },
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            {predefinedRoles.map((role) => (
              <Card key={role} className="bg-white shadow-sm">
                <CardContent className="p-6">
                  <h4 className="text-sm font-medium mb-2">{role}</h4>
                  <p className="text-2xl font-bold">{roleMap[role]}</p>
                  <div className="w-full h-2 bg-gray-200 rounded-full my-2">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{
                        width:
                          roleTotal > 0
                            ? `${((roleMap[role] / roleTotal) * 100).toFixed(
                                1
                              )}%`
                            : "0%",
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500">
                    {roleTotal > 0
                      ? `${((roleMap[role] / roleTotal) * 100).toFixed(
                          1
                        )}% of total`
                      : "0% of total"}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="table">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="mb-6">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <Input
                  placeholder="Search by name or outlet..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-indigo-600 text-white">
                    <th className="px-4 py-3 text-left">Nama Barista</th>
                    <th className="px-4 py-3 text-left">Role</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Outlet</th>
                    <th className="px-4 py-3 text-left">Kontak</th>
                    {/* <th className="px-4 py-3 text-right">Action</th> */}
                  </tr>
                </thead>
                <tbody>
                  {filteredBaristas.map((barista, index) => (
                    <tr
                      key={barista.id}
                      className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      <td className="px-4 py-3 border-t">{barista.fullName}</td>
                      <td className="px-4 py-3 border-t">{barista.role}</td>
                      <td className="px-4 py-3 border-t">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            barista.status.toLowerCase() === "active" ||
                            barista.status.toLowerCase() === "aktif"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {barista.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 border-t">{barista.outlet}</td>
                      <td className="px-4 py-3 border-t">
                        {barista.contact || "-"}
                      </td>
                      {/* <td className="px-4 py-3 border-t text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="mr-2 text-indigo-600 border-indigo-600 hover:bg-indigo-50"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          className="bg-indigo-600 hover:bg-indigo-700"
                        >
                          Detail
                        </Button>
                      </td> */}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
