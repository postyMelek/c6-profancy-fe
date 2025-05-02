"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Video, Users, Calendar } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// Import komponen Skeleton dari shadcn/ui
import { Skeleton } from "@/components/ui/skeleton";

interface TrainingMaterial {
  id: number;
  title: string;
  type: string;
  link: string;
  description: string;
  assignedRoles: string[];
  createdAt: string;
}

export default function ManajemenMateriPelatihan() {
  const [materials, setMaterials] = useState<TrainingMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("");

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    setToken(storedToken);
    const storedRoles = localStorage.getItem("roles");
    setUserRole(storedRoles || "");

    const fetchMaterials = async () => {
      try {
        setIsLoading(true);

        if (storedToken) {
          const response = await fetch(
            "http://localhost:8080/api/training-materials",
            {
              headers: {
                Authorization: `Bearer ${storedToken}`,
              },
            }
          );

          if (!response.ok) {
            throw new Error(
              `Error fetching training materials: ${response.status}`
            );
          }

          const result = await response.json();
          setMaterials(result.data);
        } else {
          // Sample data for demo purposes (jika token tidak ditemukan)
          setMaterials([
            {
              id: 1,
              title: "Introduction to Espresso Making",
              type: "VIDEO",
              link: "https://youtu.be/j-Hu4hF5PTM?si=5iZ4D_TCW2mN-DQt",
              description:
                "Pelatihan dasar dalam pembuatan espresso untuk probation barista.",
              assignedRoles: ["PROBATION_BARISTA", "TRAINEE_BARISTA"],
              createdAt: "2025-03-20T05:20:39.999+00:00",
            },
            {
              id: 2,
              title: "Latte Art Basics",
              type: "VIDEO",
              link: "https://youtu.be/example",
              description: "Teknik dasar membuat latte art untuk barista.",
              assignedRoles: ["BARISTA", "HEAD_BARISTA"],
              createdAt: "2025-03-19T08:15:22.123+00:00",
            },
            {
              id: 3,
              title: "Coffee Bean Selection Guide",
              type: "DOCUMENT",
              link: "https://docs.example.com/coffee-beans",
              description: "Panduan pemilihan biji kopi berkualitas.",
              assignedRoles: ["HEAD_BARISTA", "MANAGER"],
              createdAt: "2025-03-18T14:30:10.456+00:00",
            },
            {
              id: 4,
              title: "Brewing Methods Comparison",
              type: "DOCUMENT",
              link: "https://docs.example.com/brewing-methods",
              description: "Perbandingan berbagai metode brewing kopi.",
              assignedRoles: [
                "TRAINEE_BARISTA",
                "PROBATION_BARISTA",
                "BARISTA",
                "HEAD_BARISTA",
              ],
              createdAt: "2025-03-17T11:45:33.789+00:00",
            },
          ]);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
        console.error("Error fetching training materials:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMaterials();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString("id-ID", { month: "long" });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const handleDelete = async (id: number) => {
    if (!token) {
      // Misal: toast.error("Authentication token not found. Please login again.")
      return;
    }

    if (!confirm("Are you sure you want to delete this material?")) {
      return;
    }

    try {
      // Contoh penghapusan tanpa API (langsung hapus di state)
      setMaterials(materials.filter((material) => material.id !== id));
      // toast.success("Materi pelatihan berhasil dihapus")
    } catch (err) {
      console.error("Error deleting training material:", err);
      // toast.error("An error occurred while deleting training material")
    }
  };

  // Jika terjadi error
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
    <div className="flex flex-col">
      <div className="flex flex-col items-center mb-8">
        <h1 className="text-primary text-3xl font-bold mb-6">
          Manajemen Materi Pelatihan
        </h1>

        {userRole === "Admin" && (
          <Link href="/training-materials/create">
            <Button className="rounded-full">
              <Plus className="mr-2 h-5 w-5" />
              Tambah Materi Pelatihan
            </Button>
          </Link>
        )}
      </div>

      {/* 
        Jika masih loading, tampilkan skeleton "cards". 
        Jika sudah selesai loading (isLoading === false), tampilkan data sebenarnya 
      */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contoh menampilkan 4 card skeleton */}
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="flex">
                <div className="w-1/3">
                  {/* Skeleton untuk gambar/video thumbnail */}
                  <Skeleton className="w-full h-full object-cover" />
                </div>
                <div className="w-2/3 p-4">
                  <div className="flex justify-end mb-2">
                    {/* Skeleton untuk label type (VIDEO/DOCUMENT) */}
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>

                  {/* Skeleton judul */}
                  <Skeleton className="h-4 w-3/4 mb-2" />

                  {/* Skeleton assignedRoles */}
                  <div className="mb-1">
                    <Skeleton className="h-4 w-32" />
                  </div>

                  {/* Skeleton date */}
                  <div className="mb-4">
                    <Skeleton className="h-4 w-28" />
                  </div>

                  {/* Skeleton tombol aksi */}
                  <div className="flex space-x-2">
                    <Skeleton className="h-8 w-16 rounded-md" />
                    <Skeleton className="h-8 w-16 rounded-md" />
                    <Skeleton className="h-8 w-16 rounded-md" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {materials.map((material) => (
              <div
                key={material.id}
                className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden"
              >
                <div className="flex">
                  <div className="w-1/3">
                    <Image
                      src="/placeholder.svg?height=200&width=200"
                      alt={material.title}
                      width={200}
                      height={200}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="w-2/3 p-4">
                    <div className="flex justify-end mb-2">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                          material.type === "VIDEO"
                            ? "bg-blue-100 text-blue-600"
                            : "bg-indigo-100 text-indigo-600"
                        }`}
                      >
                        {material.type === "VIDEO" ? (
                          <>
                            <Video className="mr-1 h-4 w-4" />
                            Video
                          </>
                        ) : (
                          <>
                            <FileText className="mr-1 h-4 w-4" />
                            Dokumen
                          </>
                        )}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold mb-2">
                      {material.title}
                    </h3>

                    <div className="flex items-center text-sm text-gray-600 mb-1">
                      <Users className="mr-1 h-4 w-4" />
                      <span>{material.assignedRoles.length} Ditugaskan</span>
                    </div>

                    <div className="flex items-center text-sm text-gray-600 mb-4">
                      <Calendar className="mr-1 h-4 w-4" />
                      <span>{formatDate(material.createdAt)}</span>
                    </div>

                    <div className="flex space-x-2">
                      <Link href={`/training/materi/${material.id}`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-primary"
                        >
                          Detail
                        </Button>
                      </Link>
                      <Link href={`/training/materi/edit/${material.id}`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-primary"
                        >
                          Edit
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive border-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(material.id)}
                      >
                        Hapus
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {materials.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">Belum ada materi pelatihan</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
