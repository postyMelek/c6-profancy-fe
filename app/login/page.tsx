"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Toast from "@/components/Toast";

type StepType =
  | "checkUsername"
  | "defaultPassword"
  | "login"
  | "changePassword";

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

export default function LoginPage() {
  const router = useRouter();

  // State
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [combination, setCombination] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [step, setStep] = useState<StepType>("checkUsername");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [toast, setToast] = useState<{
    type: "success" | "error" | "info" | "warning";
    message: string;
  } | null>(null);

  // Fungsi untuk menentukan label button sesuai step
  const getButtonLabel = () => {
    switch (step) {
      case "checkUsername":
        return "Continue";
      case "defaultPassword":
        return "Login";
      case "login":
        return "Login";
      case "changePassword":
        return "Ganti Password";
      default:
        return "Lanjut";
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true); // Mulai loading

    try {
      switch (step) {
        case "checkUsername": {
          const res = await fetch(
            "http://localhost:8080/api/auth/check-username",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ username }),
            }
          );
          const result = await res.json();
          if (res.ok) {
            if (result.data.isVerified) {
              setStep("login");
            } else {
              setStep("defaultPassword");
            }
          } else {
            setToast({ type: "error", message: result.message });
          }
          break;
        }

        case "defaultPassword": {
          if (password === "newuser123") {
            setStep("changePassword");
            setPassword("");
          } else {
            setToast({
              type: "error",
              message: "Default password tidak sesuai.",
            });
          }
          break;
        }

        case "login": {
          const res = await fetch("http://localhost:8080/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
          });
          const result = await res.json();

          if (res.ok) {
            const token = result.data.token;
            localStorage.setItem("token", token);
            localStorage.setItem("username", username);

            const jwtPayload = parseJwt(token);
            if (jwtPayload && jwtPayload.roles) {
              const cleanedRoles = jwtPayload.roles.map((role: string) =>
                role.replace("ROLE_", "")
              );
              if (cleanedRoles.length === 1) {
                localStorage.setItem("roles", cleanedRoles[0]);
              } else {
                localStorage.setItem("roles", JSON.stringify(cleanedRoles));
              }
            }
            router.push("/");
          } else {
            setToast({ type: "error", message: result.message });
          }
          break;
        }

        case "changePassword": {
          const res = await fetch(
            `http://localhost:8080/api/account/change-password?username=${username}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                combination,
                newPassword,
              }),
            }
          );
          const result = await res.json();
          if (res.ok) {
            setToast({ type: "success", message: result.message });
            // Reset form ke default
            setStep("checkUsername");
            setUsername("");
            setPassword("");
            setCombination("");
            setNewPassword("");
          } else {
            setToast({ type: "error", message: result.message });
          }
          break;
        }

        default:
          break;
      }
    } finally {
      setIsLoading(false); // Akhiri loading
    }
  };

  const handleForgotPassword = () => {
    if (!username) {
      setToast({
        type: "error",
        message: "Harap masukkan username terlebih dahulu.",
      });
      return;
    }
    setStep("changePassword");
  };

  return (
    <div className="flex min-h-screen w-full">
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
          duration={3000}
        />
      )}
      {/* Logo Section */}
      <div className="hidden md:flex md:w-1/2 items-center justify-center bg-white">
        <Image
          className="dark:invert"
          src="/images/login_logo.png"
          alt="Logo"
          width={500}
          height={500}
          priority
        />
      </div>

      {/* Login Form Section */}
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-[#3c67ff]">
              Barista Management System
            </h2>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {/* Field Username selalu tampil.
                Jika step "checkUsername", username di-enable. Jika tidak, di-disable */}
            <div>
              <label
                htmlFor="username"
                className="block text-[#3b5694] text-lg mb-2"
              >
                Username
              </label>
              <Input
                id="username"
                name="username"
                type="text"
                required
                className="w-full h-14 px-4 border border-[#d9d9d9] rounded-md"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={step !== "checkUsername"}
              />
              <p className="text-sm text-blue-500">nama_depan.nama_belakang</p>
            </div>

            {/* Field tambahan sesuai step */}
            {step === "defaultPassword" && (
              <div>
                <label
                  htmlFor="password"
                  className="block text-[#3b5694] text-lg mb-2"
                >
                  Default Password
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="w-full h-14 px-4 border border-[#d9d9d9] rounded-md"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <p className="text-sm text-blue-500">
                  Masukkan &quot;newuser123&quot;
                </p>
              </div>
            )}

            {step === "login" && (
              <div>
                <label
                  htmlFor="password"
                  className="block text-[#3b5694] text-lg mb-2"
                >
                  Password
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="w-full h-14 px-4 border border-[#d9d9d9] rounded-md"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            )}

            {step === "changePassword" && (
              <>
                <div>
                  <label
                    htmlFor="combination"
                    className="block text-[#3b5694] text-lg mb-2"
                  >
                    Kombinasi (username@noHP)
                  </label>
                  <Input
                    id="combination"
                    name="combination"
                    type="text"
                    required
                    className="w-full h-14 px-4 border border-[#d9d9d9] rounded-md"
                    value={combination}
                    onChange={(e) => setCombination(e.target.value)}
                    placeholder={`${username}@... (tanpa +62)`}
                  />
                </div>
                <div>
                  <label
                    htmlFor="newPassword"
                    className="block text-[#3b5694] text-lg mb-2"
                  >
                    Password Baru
                  </label>
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    required
                    className="w-full h-14 px-4 border border-[#d9d9d9] rounded-md"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
              </>
            )}

            <div>
              <Button
                type="submit"
                className="w-full h-14 bg-[#3c67ff] hover:bg-[#3b5694] text-white text-lg font-medium rounded-md"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <svg
                      aria-hidden="true"
                      className="w-5 h-5 animate-spin text-white"
                      viewBox="0 0 100 101"
                      fill="none"
                    >
                      <path
                        d="M100 50.5908C100 78.2054 77.6142 100.591 50 
                          100.591C22.3858 100.591 0 78.2054 0 
                          50.5908C0 22.9762 22.3858 0.59082 50 
                          0.59082C77.6142 0.59082 100 22.9762 100 
                          50.5908ZM9.08197 50.5908C9.08197 73.0309 
                          27.5599 91.5088 50 91.5088C72.4401 
                          91.5088 90.918 73.0309 90.918 
                          50.5908C90.918 28.1507 72.4401 
                          9.67277 50 9.67277C27.5599 9.67277 
                          9.08197 28.1507 9.08197 50.5908Z"
                        fill="#E5E7EB"
                      />
                      <path
                        d="M93.9676 39.0409C96.393 
                          38.4038 97.8624 35.9116 
                          96.9809 33.5534C95.1308 28.8225 
                          92.6032 24.3692 89.4994 20.348 
                          C85.9254 15.1192 80.8826 10.7236 
                          74.9414 7.41289C68.9999 4.10227 
                          62.3412 2.0428 55.4638 1.3813C52.8455 
                          1.13836 50.6021 3.0001 50.2203 
                          5.61795C49.8385 8.2358 51.6857 
                          10.5072 54.2679 10.848C59.74 
                          11.5064 64.95 13.1015 69.5551 
                          16.036C74.1602 18.9706 77.9873 
                          23.1245 80.7609 28.1084C82.5887 
                          31.433 84.0066 35.0459 85.0009 
                          38.8162C85.5852 40.8863 87.5422 
                          42.2796 89.9676 41.6425Z"
                        fill="currentColor"
                      />
                    </svg>
                    <span>Loading...</span>
                  </div>
                ) : (
                  getButtonLabel()
                )}
              </Button>
            </div>
          </form>

          {step !== "changePassword" && (
            <div className="text-center">
              <Link
                href="#"
                className="text-[#3b5694] hover:text-[#3c67ff] text-base"
                onClick={handleForgotPassword}
              >
                Forgot Password?
              </Link>
            </div>
          )}

          <div className="text-center text-sm text-[#3b5694] mt-8">
            ©All rights reserved
          </div>
        </div>
      </div>
    </div>
  );
}
