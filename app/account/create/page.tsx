"use client";
import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Toast from "@/components/Toast";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export default function TambahAkunBaru() {
  const [role, setRole] = useState("");
  const [nama, setNama] = useState("");
  const [gender, setGender] = useState("Laki-Laki");
  const [phone, setPhone] = useState("+62");
  const [birthdate, setBirthdate] = useState<Date | null>(null);
  const [address, setAddress] = useState("");
  const [outlet, setOutlet] = useState("");
  const [status, setStatus] = useState("Active");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isValid, setIsValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error" | "info" | "warning";
    message: string;
  } | null>(null);
  const router = useRouter();

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!nama.trim()) {
      newErrors.nama = "Nama lengkap wajib diisi.";
    }
    if (!birthdate) {
      newErrors.birthdate = "Tanggal lahir wajib diisi.";
    }
    if (!address.trim()) {
      newErrors.address = "Alamat wajib diisi.";
    }
    if (!/^\+62\d{9,}$/.test(phone)) {
      newErrors.phone = "Nomor HP minimal 9 digit setelah +62.";
    }
    if (!role) {
      newErrors.role = "Role wajib dipilih.";
    } else if (
      ["Head Bar", "Barista", "Trainee Barista", "Probation Barista"].includes(
        role
      ) &&
      !outlet
    ) {
      newErrors.outlet = "Outlet wajib diisi untuk peran ini.";
    }
    if (nama.trim().length > 100) {
      newErrors.nama = "Nama tidak boleh lebih dari 100 karakter.";
    }
    if (address.trim().length > 200) {
      newErrors.address = "Alamat tidak boleh lebih dari 200 karakter.";
    }
    setErrors(newErrors);
    setIsValid(Object.keys(newErrors).length === 0);
  };

  useEffect(() => {
    validateForm();
  }, [role, nama, gender, phone, birthdate, address, outlet, status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    validateForm();
    if (!Object.keys(errors).length && !isValid) {
      return;
    }
    if (!isValid) return;
    const token = localStorage.getItem("token");
    if (!token) {
      setToast({
        type: "error",
        message: "Token tidak ditemukan. Silakan login ulang.",
      });
      return;
    }
    if (isSubmitting) return;
    setIsSubmitting(true);
    const noOutletNeeded = ["Admin", "CEO", "CIOO", "CMO"];
    const outletName = noOutletNeeded.includes(role) ? "" : outlet;
    const today = new Date();
    if (birthdate && (birthdate < new Date(1900, 0, 1) || birthdate > today)) {
      setErrors((prev) => ({
        ...prev,
        birthdate: "Tanggal lahir tidak valid.",
      }));
      setIsSubmitting(false);
      return;
    }
    const formattedBirthdate = birthdate ? format(birthdate, "yyyy-MM-dd") : "";
    const requestBody = {
      role: role,
      fullName: nama.trim(),
      gender: gender === "Laki-Laki" ? true : false,
      phoneNumber: phone.trim(),
      address: address.trim(),
      dateOfBirth: formattedBirthdate,
      outletName: outletName,
      status: status,
    };
    try {
      const response = await fetch("http://localhost:8080/api/account/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });
      if (!response.ok) {
        const errorData = await response.json();
        if (
          errorData.message &&
          errorData.message.includes("head_bar_outlet_id_key")
        ) {
          setToast({
            type: "error",
            message: "Outlet ini sudah memiliki Head Bar.",
          });
        } else {
          setToast({
            type: "error",
            message: "Pembuatan akun gagal. Silakan coba lagi.",
          });
        }
        setIsSubmitting(false);
        return;
      }
      const data = await response.json();
      if (data.status === 201) {
        setToast({ type: "success", message: "Akun berhasil dibuat!" });
        setTimeout(() => {
          router.push("/account/");
        }, 1000);
      } else {
        setToast({
          type: "error",
          message: data.message || "Terjadi kesalahan. Silakan coba lagi.",
        });
      }
    } catch (err) {
      console.error("Error saat menyimpan akun:", err);
      setToast({
        type: "error",
        message: "Pembuatan akun gagal. Silakan coba lagi.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="p-6">
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
          duration={3000}
        />
      )}
      <div className="flex flex-col items-center">
        <h1 className="text-primary text-3xl font-bold mb-6">
          Tambah Akun Baru
        </h1>
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-4xl border border-gray-200 rounded-lg p-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="role" className="block font-medium">
                  Role
                </label>
                <div className="relative">
                  <select
                    id="role"
                    className="w-full border border-gray-300 rounded-lg p-2.5 pr-10 appearance-none focus:outline-none focus:ring-2 focus:ring-primary"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option value="">Pilih Role</option>
                    <option value="Admin">Admin</option>
                    <option value="CEO">CEO</option>
                    <option value="CIOO">CIOO</option>
                    <option value="CMO">CMO</option>
                    <option value="Head Bar">Head Bar</option>
                    <option value="Barista">Barista</option>
                    <option value="Trainee Barista">Trainee Barista</option>
                    <option value="Probation Barista">Probation Barista</option>
                  </select>
                  {errors.role && (
                    <p className="text-red-500 text-sm">{errors.role}</p>
                  )}
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
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
                <label htmlFor="outlet" className="block font-medium">
                  Outlet
                </label>
                <div className="relative">
                  <select
                    id="outlet"
                    className="w-full border border-gray-300 rounded-lg p-2.5"
                    value={outlet}
                    onChange={(e) => setOutlet(e.target.value)}
                    disabled={["Admin", "CEO", "CIO", "CMO"].includes(role)}
                  >
                    <option value="">Pilih Outlet</option>
                    <option value="Tens Coffee Margonda">
                      Tens Coffee Margonda
                    </option>
                    <option value="Tens Coffee Kantin Vokasi UI">
                      Tens Coffee Kantin Vokasi UI
                    </option>
                    <option value="Tens Coffee UIN Ciputat">
                      Tens Coffee UIN Ciputat
                    </option>
                    <option value="Tens Coffee Pamulang">
                      Tens Coffee Pamulang
                    </option>
                    <option value="Tens Coffee UPN Veteran Jakarta">
                      Tens Coffee UPN Veteran Jakarta
                    </option>
                  </select>
                  {errors.outlet && (
                    <p className="text-red-500 text-sm">{errors.outlet}</p>
                  )}
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
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
                <label htmlFor="nama" className="block font-medium">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  id="nama"
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                />
                {errors.nama && (
                  <p className="text-red-500 text-sm">{errors.nama}</p>
                )}
              </div>
              <div className="space-y-2">
                <label htmlFor="gender" className="block font-medium">
                  Jenis Kelamin
                </label>
                <div className="relative">
                  <select
                    id="gender"
                    className="w-full border border-gray-300 rounded-lg p-2.5 pr-10 appearance-none focus:outline-none focus:ring-2 focus:ring-primary"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                  >
                    <option value="Laki-Laki">Laki-Laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
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
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="phone" className="block font-medium">
                  Nomor HP
                </label>
                <input
                  type="text"
                  id="phone"
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm">{errors.phone}</p>
                )}
              </div>
              <div className="space-y-2">
                <label htmlFor="birthdate" className="block font-medium">
                  Tanggal Lahir
                </label>
                <DatePicker
                  selected={birthdate}
                  onChange={(date: Date | null) => setBirthdate(date)}
                  dateFormat="dd MMMM yyyy"
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  minDate={new Date(1900, 0, 1)}
                  maxDate={new Date()}
                  placeholderText="09 Maret 2004"
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-primary"
                  locale={localeId}
                />
                {errors.birthdate && (
                  <p className="text-red-500 text-sm">{errors.birthdate}</p>
                )}
              </div>
              <div className="space-y-2">
                <label htmlFor="address" className="block font-medium">
                  Alamat
                </label>
                <input
                  type="text"
                  id="address"
                  placeholder="Jl. "
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
                {errors.address && (
                  <p className="text-red-500 text-sm">{errors.address}</p>
                )}
              </div>
              <div className="space-y-2">
                <label htmlFor="status" className="block font-medium">
                  Status Akun
                </label>
                <div className="relative">
                  <select
                    id="status"
                    className="w-full border border-gray-300 rounded-lg p-2.5 pr-10 appearance-none focus:outline-none focus:ring-2 focus:ring-primary"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="Active">Active</option>
                    <option value="Revoked">Revoked</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
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
            </div>
          </div>
          <div className="flex justify-center gap-4 mt-10">
            <Link href="/account/">
              <Button
                variant="outline"
                className="w-40 border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                Batal
              </Button>
            </Link>
            <Button
              className="w-40"
              onClick={handleSubmit}
              disabled={!isValid || isSubmitting}
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Akun"}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}
