/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

interface AccountData {
  fullName: string;
  username: string;
  gender: boolean;
  role: string;
  phoneNumber: string;
  address: string;
  dateOfBirth: string | null;
  status: string;
  outlet: string;
}

interface ApiResponse {
  status: number;
  message: string;
  timestamp: string;
  data: AccountData | null;
}

export default function EditProfile() {
  const params = useParams();
  const router = useRouter();
  const originalUsername = params.username as string;

  // State data user
  const [accountData, setAccountData] = useState<AccountData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State field editable
  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState<boolean>(true);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(undefined);

  // Field lain (read-only, kecuali password)
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [outlet, setOutlet] = useState("");

  // Password baru (opsional)
  const [newPassword, setNewPassword] = useState("");

  // Verifikasi komb. username@noHP jika password diubah
  const [showCombinationModal, setShowCombinationModal] = useState(false);
  const [combinationInput, setCombinationInput] = useState("");
  const [combinationError, setCombinationError] = useState("");

  // State validasi & proses simpan
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isValid, setIsValid] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Ambil data user
  useEffect(() => {
    const fetchAccountData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("token");
        const response = await fetch(
          `http://localhost:8080/api/account/${originalUsername}`,
          {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!response.ok) {
          throw new Error(`Error fetching account data: ${response.status}`);
        }
        const data: ApiResponse = await response.json();
        if (data.data) {
          setAccountData(data.data);
          setFullName(data.data.fullName);
          setGender(data.data.gender);
          setPhoneNumber(data.data.phoneNumber);
          setAddress(data.data.address);
          if (data.data.dateOfBirth) {
            setDateOfBirth(new Date(data.data.dateOfBirth));
          } else {
            setDateOfBirth(undefined);
          }
          setRole(data.data.role);
          setStatus(data.data.status);
          setOutlet(data.data.outlet);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
        console.error("Error fetching account data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    if (originalUsername) {
      fetchAccountData();
    }
  }, [originalUsername]);

  // Fungsi validasi form
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // Nama Lengkap
    if (!fullName.trim()) {
      newErrors.fullName = "Nama lengkap wajib diisi.";
    } else if (fullName.trim().length > 100) {
      newErrors.fullName = "Nama tidak boleh lebih dari 100 karakter.";
    }

    // Nomor HP
    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = "Nomor HP wajib diisi.";
    } else if (!/^\+62\d{9,}$/.test(phoneNumber)) {
      newErrors.phoneNumber = "Nomor HP minimal 9 digit setelah +62.";
    }

    // Alamat
    if (!address.trim()) {
      newErrors.address = "Alamat wajib diisi.";
    } else if (address.trim().length > 200) {
      newErrors.address = "Alamat tidak boleh lebih dari 200 karakter.";
    }

    // Tanggal Lahir
    if (!dateOfBirth) {
      newErrors.dateOfBirth = "Tanggal lahir wajib diisi.";
    } else {
      const today = new Date();
      if (dateOfBirth < new Date(1900, 0, 1) || dateOfBirth > today) {
        newErrors.dateOfBirth = "Tanggal lahir tidak valid.";
      }
    }

    setErrors(newErrors);
    setIsValid(Object.keys(newErrors).length === 0);
  };

  // Jalankan validasi setiap kali field berubah
  useEffect(() => {
    validateForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullName, phoneNumber, address, dateOfBirth, gender]);

  // Submit update ke server
  const submitUpdate = async () => {
    try {
      setIsSaving(true);
      const token = localStorage.getItem("token");
      const payload: any = {
        username: originalUsername,
        fullName: fullName.trim(),
        gender: gender,
        phoneNumber: phoneNumber.trim(),
        address: address.trim(),
        dateOfBirth: dateOfBirth ? format(dateOfBirth, "yyyy-MM-dd") : "",
      };
      if (newPassword.trim() !== "") {
        payload.password = newPassword;
      }
      const response = await fetch(
        `http://localhost:8080/api/account/update-personal?username=${originalUsername}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );
      const result = await response.json();
      if (!response.ok) {
        setError(result.message || "Error updating data");
        return;
      }
      router.push(`/account/${originalUsername}`);
    } catch (err) {
      console.error("Error updating personal data:", err);
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Klik Save Changes
  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi
    validateForm();
    if (!Object.keys(errors).length && !isValid) {
      return;
    }
    if (!isValid) {
      return;
    }

    // Jika user memasukkan password, wajib verifikasi combination
    if (newPassword.trim() !== "") {
      setShowCombinationModal(true);
    } else {
      await submitUpdate();
    }
  };

  // Konfirmasi combination
  const handleConfirmCombination = async () => {
    const normalizedPhone = phoneNumber.startsWith("+62")
      ? phoneNumber.replace(/^\+62/, "")
      : phoneNumber;
    const expectedCombination = `${originalUsername}@${normalizedPhone}`;
    if (combinationInput === expectedCombination) {
      setShowCombinationModal(false);
      setCombinationInput("");
      setCombinationError("");
      await submitUpdate();
    } else {
      setCombinationError(
        "Kombinasi tidak sesuai. Pastikan format: username@noHP"
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
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
  if (!accountData) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-2">Account Not Found</h3>
          <p>The requested account could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-col items-center mb-6">
        <h1 className="text-primary text-3xl font-bold mb-6">Edit Profile</h1>
        <div className="w-full max-w-4xl border border-gray-200 rounded-lg p-8 bg-white shadow-sm">
          <form onSubmit={handleSaveChanges}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-2">Role</h3>
                  <p className="text-gray-700">{role}</p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Username</h3>
                  <p className="text-gray-700">{originalUsername}</p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Nama Lengkap</h3>
                  <Input
                    type="text"
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none"
                  />
                  {errors.fullName && (
                    <p className="text-red-500 text-sm">{errors.fullName}</p>
                  )}
                </div>
                <div>
                  <h3 className="font-medium mb-2">Jenis Kelamin</h3>
                  <select
                    id="gender"
                    value={gender ? "male" : "female"}
                    onChange={(e) => setGender(e.target.value === "male")}
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none"
                  >
                    <option value="male">Laki-Laki</option>
                    <option value="female">Perempuan</option>
                  </select>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-2">Nomor HP</h3>
                  <Input
                    type="text"
                    id="phoneNumber"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none"
                  />
                  {errors.phoneNumber && (
                    <p className="text-red-500 text-sm">{errors.phoneNumber}</p>
                  )}
                </div>
                <div>
                  <h3 className="font-medium mb-2">Alamat</h3>
                  <Input
                    type="text"
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none"
                  />
                  {errors.address && (
                    <p className="text-red-500 text-sm">{errors.address}</p>
                  )}
                </div>
                <div>
                  <h3 className="font-medium mb-2">Tanggal Lahir</h3>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateOfBirth
                          ? format(dateOfBirth, "dd MMMM yyyy", {
                              locale: localeId,
                            })
                          : "Select birthdate"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dateOfBirth}
                        onSelect={setDateOfBirth}
                        initialFocus
                        disabled={(day) => day > new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.dateOfBirth && (
                    <p className="text-red-500 text-sm">{errors.dateOfBirth}</p>
                  )}
                </div>
                <div>
                  <h3 className="font-medium mb-2">Outlet</h3>
                  <p className="text-gray-700">{outlet}</p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Status Akun</h3>
                  <div className="inline-block">
                    <span
                      className={`px-4 py-1 rounded-full text-sm ${
                        status === "Active"
                          ? "bg-green-100 text-success"
                          : "bg-red-100 text-destructive"
                      }`}
                    >
                      {status === "Active" ? "Active" : "Revoked"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* New Password */}
            <div className="mt-6">
              <h3 className="font-medium mb-2">New Password</h3>
              <Input
                type="password"
                id="newPassword"
                placeholder="Masukkan password baru jika ingin diubah"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-4 mt-10">
              <Link href={`/account/${originalUsername}`}>
                <Button
                  type="button"
                  variant="outline"
                  className="w-40 border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  Batal
                </Button>
              </Link>
              <Button type="submit" className="w-40" disabled={isSaving}>
                {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Combination Modal */}
      {showCombinationModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg p-6 w-80">
            <h2 className="text-xl font-bold mb-4">Verifikasi Kombinasi</h2>
            <p className="mb-2">
              Masukkan Kombinasi (username@noHP). Contoh:{" "}
              {`${originalUsername}@81375349081`}
            </p>
            <Input
              type="text"
              value={combinationInput}
              onChange={(e) => setCombinationInput(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none mb-2"
            />
            {combinationError && (
              <p className="text-destructive text-sm mb-2">
                {combinationError}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCombinationModal(false);
                  setCombinationInput("");
                  setCombinationError("");
                }}
              >
                Batal
              </Button>
              <Button onClick={handleConfirmCombination}>Konfirmasi</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
