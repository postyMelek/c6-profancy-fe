"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, ArrowDownAZ, Filter, Search } from "lucide-react";
import Link from "next/link";

import { Skeleton } from "@/components/ui/skeleton";

interface UserData {
  username: string;
  name: string;
  role: string;
  phone: string;
  outlet: string;
  status: "Active" | "Revoked";
}

interface UserApiResponse {
  username?: string;
  fullName?: string;
  role?: string;
  phoneNumber?: string;
  outlet?: string;
  status?: string;
}

export default function DaftarAkun() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string>("");
  // State untuk filter, sort, dll.
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [filterRole, setFilterRole] = useState("");
  const [filterOutlet, setFilterOutlet] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedRole = localStorage.getItem("roles");
    const storedUsername = localStorage.getItem("username") || "";
    setUserRole(storedRole);
    setCurrentUsername(storedUsername);

    async function fetchUserData() {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          alert("Token tidak ditemukan. Silakan login ulang.");
          setIsLoading(false);
          return;
        }

        const response = await fetch(
          "http://localhost:8080/api/account/viewall",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          alert("Gagal mengambil data user. Silakan coba lagi.");
          setIsLoading(false);
          return;
        }

        const result = await response.json();
        if (result?.data) {
          const mappedUsers: UserData[] = (
            result.data as UserApiResponse[]
          ).map((item) => ({
            username: item.username ?? "-",
            name: item.fullName ?? "-",
            role: item.role ?? "-",
            phone: item.phoneNumber ?? "-",
            outlet: item.outlet ?? "-",
            status: item.status === "Revoked" ? "Revoked" : "Active",
          }));

          setUsers(mappedUsers);
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
        alert("Terjadi kesalahan saat mengambil data user.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserData();
  }, []);

  // Ambil outlet user yang login (jika ada)
  const currentUserOutlet =
    users.find((u) => u.username === currentUsername)?.outlet || "";

  // Filter data
  const filteredUsers = users.filter((user) => {
    const lowerSearch = searchTerm.toLowerCase();
    const matchesSearch =
      user.name.toLowerCase().includes(lowerSearch) ||
      user.outlet.toLowerCase().includes(lowerSearch);
    const matchesRole = filterRole ? user.role === filterRole : true;
    const matchesOutlet = filterOutlet ? user.outlet === filterOutlet : true;
    const matchesCurrentOutlet =
      userRole !== "Admin" ? user.outlet === currentUserOutlet : true;
    return (
      matchesSearch && matchesRole && matchesOutlet && matchesCurrentOutlet
    );
  });

  // Sort data; prioritas diberikan pada current user agar tampil di atas
  const displayedUsers = filteredUsers.sort((a, b) => {
    if (a.username === currentUsername && b.username !== currentUsername)
      return -1;
    if (b.username === currentUsername && a.username !== currentUsername)
      return 1;
    return sortOrder === "asc"
      ? a.name.localeCompare(b.name)
      : b.name.localeCompare(a.name);
  });

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  return (
    <div className="flex flex-col">
      <div className="flex flex-col items-center mb-6">
        <h1 className="text-primary text-3xl font-bold mb-6">Daftar Akun</h1>
        {/* Tampilkan tombol tambah akun hanya untuk Admin */}
        {userRole === "Admin" && (
          <Link href="/account/create">
            <Button className="rounded-full">
              <Plus className="mr-2 h-5 w-5" />
              Tambah Akun Baru
            </Button>
          </Link>
        )}
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search by name or outlet..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        <Button variant="outline" className="gap-2" onClick={toggleSortOrder}>
          <ArrowDownAZ className="h-5 w-5" />
          Sort By ({sortOrder === "asc" ? "A-Z" : "Z-A"})
        </Button>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => setShowFilters((prev) => !prev)}
        >
          <Filter className="h-5 w-5" />
          Filter
        </Button>
      </div>

      {showFilters && (
        <div className="flex gap-4 mb-4">
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Filter by Role</option>
            <option value="Admin">Admin</option>
            <option value="CEO">CEO</option>
            <option value="CIOO">CIOO</option>
            <option value="CMO">CMO</option>
            <option value="Head Bar">Head Bar</option>
            <option value="Barista">Barista</option>
            <option value="Trainee Barista">Trainee Barista</option>
            <option value="Probation Barista">Probation Barista</option>
          </select>
          <select
            value={filterOutlet}
            onChange={(e) => setFilterOutlet(e.target.value)}
            className="border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Filter by Outlet</option>
            <option value="Tens Coffee Margonda">Tens Coffee Margonda</option>
            <option value="Tens Coffee Kantin Vokasi UI">
              Tens Coffee Kantin Vokasi UI
            </option>
            <option value="Tens Coffee UIN Ciputat">
              Tens Coffee UIN Ciputat
            </option>
            <option value="Tens Coffee Pamulang">Tens Coffee Pamulang</option>
            <option value="Tens Coffee UPN Veteran Jakarta">
              Tens Coffee UPN Veteran Jakarta
            </option>
          </select>
        </div>
      )}

      <div className="overflow-x-auto">
        {isLoading ? (
          <table className="w-full border-collapse shadow-md rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-primary text-white">
                <th className="py-4 px-6 text-left font-bold">Username</th>
                <th className="py-4 px-6 text-left font-bold">Nama Lengkap</th>
                {userRole === "Admin" && (
                  <th className="py-4 px-6 text-left font-bold">No HP</th>
                )}
                <th className="py-4 px-6 text-left font-bold">Outlet</th>
                <th className="py-4 px-6 text-left font-bold">Status</th>
                <th className="py-4 px-6 text-left font-bold">Action</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b even:bg-primary-bg">
                  <td className="py-4 px-6">
                    <Skeleton className="h-4 w-20" />
                  </td>
                  <td className="py-4 px-6">
                    <Skeleton className="h-4 w-32" />
                  </td>
                  {userRole === "Admin" && (
                    <td className="py-4 px-6">
                      <Skeleton className="h-4 w-24" />
                    </td>
                  )}
                  <td className="py-4 px-6">
                    <Skeleton className="h-4 w-32" />
                  </td>
                  <td className="py-4 px-6">
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </td>
                  <td className="py-4 px-6">
                    <Skeleton className="h-8 w-16 rounded-md" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full border-collapse shadow-md rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-primary text-white">
                <th className="py-4 px-6 text-left font-bold">Username</th>
                <th className="py-4 px-6 text-left font-bold">Nama Lengkap</th>
                {userRole === "Admin" && (
                  <th className="py-4 px-6 text-left font-bold">No HP</th>
                )}
                <th className="py-4 px-6 text-left font-bold">Outlet</th>
                <th className="py-4 px-6 text-left font-bold">Status</th>
                <th className="py-4 px-6 text-left font-bold">Action</th>
              </tr>
            </thead>
            <tbody>
              {displayedUsers.map((user, index) => (
                <tr key={index} className="border-b even:bg-primary-bg">
                  <td className="py-4 px-6">{user.username}</td>
                  <td className="py-4 px-6">{user.name}</td>
                  {userRole === "Admin" && (
                    <td className="py-4 px-6">{user.phone}</td>
                  )}
                  <td className="py-4 px-6">{user.outlet}</td>
                  <td className="py-4 px-6">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        user.status === "Active"
                          ? "text-green-600 bg-green-100"
                          : "text-red-600 bg-red-100"
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap">
                    <div className="flex gap-2">
                      {(userRole === "Admin" ||
                        user.username === currentUsername) && (
                        <>
                          <Link
                            href={
                              userRole === "Admin"
                                ? `/account/edit/${user.username}`
                                : `/account/edit-profile/${user.username}`
                            }
                          >
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-lg bg-primary-lightest text-primary border-none hover:bg-primary-lightest/80"
                            >
                              Edit
                            </Button>
                          </Link>
                          <Link href={`/account/${user.username}`}>
                            <Button size="sm" className="rounded-lg">
                              Detail
                            </Button>
                          </Link>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {displayedUsers.length === 0 && (
                <tr>
                  <td
                    colSpan={userRole === "Admin" ? 7 : 6}
                    className="py-4 px-6 text-center"
                  >
                    Tidak ada data.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
