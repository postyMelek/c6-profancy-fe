"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import Toast from "@/components/Toast";

interface FormData {
  title: string;
  type: string;
  link: string;
  description: string;
  assignedRoles: string[];
}

export default function TambahMateriPelatihan() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    title: "",
    type: "VIDEO",
    link: "",
    description: "",
    assignedRoles: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    type: "success" | "error" | "info" | "warning";
    message: string;
  } | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    setToken(storedToken);
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = Array.from(e.target.selectedOptions).map(
      (option) => option.value
    );
    setSelectedRoles(options);
    setFormData((prev) => ({
      ...prev,
      assignedRoles: options,
    }));
  };

  const validateForm = () => {
    if (
      !formData.title ||
      !formData.link ||
      !formData.description ||
      formData.assignedRoles.length === 0
    ) {
      setToast({
        type: "error",
        message: "Please fill in all required fields",
      });
      return false;
    }

    // Check if the link starts with "https://"
    if (!/^https:\/\//.test(formData.link)) {
      setToast({ type: "error", message: "Link must start with 'https://'." });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setToast({
        type: "error",
        message: "Authentication token not found. Please login again.",
      });
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch(
        "http://localhost:8080/api/training-materials/create",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        }
      );

      const result = await response.json();

      if (response.ok) {
        // Raise success toast
        setToast({
          type: "success",
          message: "Materi pelatihan berhasil ditambahkan",
        });
        // After a short delay, navigate to the training materials page
        setTimeout(() => {
          router.push("/training-materials");
        }, 2000);
      } else {
        setToast({
          type: "error",
          message: result.message || "Failed to add training material",
        });
      }
    } catch (err) {
      console.error("Error adding training material:", err);
      setToast({
        type: "error",
        message: "An error occurred while adding training material",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col">
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
          duration={3000}
        />
      )}
      <div className="mb-6">
        <Link
          href="/training-materials/"
          className="inline-flex items-center text-primary hover:text-primary/80"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Link>
      </div>

      <div className="w-full max-w-4xl border border-gray-200 rounded-lg p-8 bg-white shadow-sm">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="title" className="block font-medium">
                  Judul Materi
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Masukkan judul materi"
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="type" className="block font-medium">
                  Tipe Materi
                </label>
                <div className="relative">
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg p-2.5 pr-10 appearance-none focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="VIDEO">Video</option>
                    <option value="DOCUMENT">Document</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="link" className="block font-medium">
                  Link Materi
                </label>
                <input
                  type="text"
                  id="link"
                  name="link"
                  value={formData.link}
                  onChange={handleInputChange}
                  placeholder="Link Material Video/Dokumen"
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="description" className="block font-medium">
                  Deskripsi Materi
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Deskripsi materi pelatihan"
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-primary min-h-[150px]"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="assignedRoles" className="block font-medium">
                  Assign User
                </label>
                <div className="relative">
                  <select
                    id="assignedRoles"
                    name="assignedRoles"
                    multiple
                    value={selectedRoles}
                    onChange={handleRoleChange}
                    className="w-full border border-gray-300 rounded-lg p-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                    size={4}
                  >
                    <option value="TRAINEE_BARISTA">Trainee Barista</option>
                    <option value="PROBATION_BARISTA">Probation Barista</option>
                    <option value="BARISTA">Barista</option>
                    <option value="HEAD_BARISTA">Head Barista</option>
                    <option value="MANAGER">Manager</option>
                  </select>
                  <div className="text-xs text-gray-500 mt-1">
                    Hold Ctrl (or Cmd) to select multiple roles
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-center gap-4 mt-10">
            <Link href="/training/materi">
              <Button
                type="button"
                variant="outline"
                className="w-40 border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                Batal
              </Button>
            </Link>
            <Button type="submit" className="w-40" disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Simpan Materi"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
