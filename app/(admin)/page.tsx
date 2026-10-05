"use client";

import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  CheckCircle2,
} from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      setError("Please enter your email address.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

   try {
  setLoading(true);

  const response = await axios.post(
    "/api/auth/login",
    {
      email: trimmedEmail,
      password,
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true,
    }
  );

  const data = response.data;

  if (!data?.success) {
    setError(data?.message || "Invalid email or password.");
    return;
  }

  setSuccess("Login successful. Redirecting...");

  setTimeout(() => {
    router.replace("/dashboard");
    router.refresh();
  }, 1500);
} catch (error) {
  console.error("LOGIN REQUEST ERROR:", error);

  if (axios.isAxiosError(error)) {
    setError(
      error.response?.data?.message ||
        error.message ||
        "Unable to connect to the server. Please try again."
    );
  } else {
    setError(
      error instanceof Error
        ? error.message
        : "Unable to connect to the server. Please try again."
    );
  }
} finally {
  setLoading(false);
}
  }

  return (
    <>
      {/* =================================================
          SUCCESS ANIMATION POPUP (MODAL)
      ================================================== */}
      {success && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#080808]/40 backdrop-blur-sm transition-all duration-300 font-['Sora',sans-serif]">
          <div className="flex animate-[bounce_0.5s_ease-in-out] flex-col items-center justify-center rounded-3xl bg-white p-8 shadow-2xl w-[90%] max-w-sm text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 size={32} className="text-green-600" />
            </div>
            <h3 className="text-xl font-bold tracking-tight text-[#080808]">
              Welcome back!
            </h3>
            <p className="mt-2 text-sm font-medium text-gray-500">{success}</p>
            <div className="mt-6 flex gap-1.5">
              <span className="h-2 w-2 animate-bounce rounded-full bg-[#ffb646] [animation-delay:-0.3s]"></span>
              <span className="h-2 w-2 animate-bounce rounded-full bg-[#ffb646] [animation-delay:-0.15s]"></span>
              <span className="h-2 w-2 animate-bounce rounded-full bg-[#ffb646]"></span>
            </div>
          </div>
        </div>
      )}

      <main className="min-h-screen bg-[#ffe9d9] font-['Sora',sans-serif]">
        <div className="grid min-h-screen lg:grid-cols-2">
          {/* =====================================================
              LEFT SIDE (BRANDING)
          ====================================================== */}
          <section className="relative hidden overflow-hidden bg-[#080808] lg:flex">
            {/* Background glow matching your Zoidics Brand */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-[#ffb646]/15 blur-3xl" />
              <div className="absolute -bottom-32 -right-20 h-[450px] w-[450px] rounded-full bg-[#ff8a24]/10 blur-3xl" />
            </div>

            <div className="relative flex w-full flex-col justify-between p-12 xl:p-16 z-10">
              {/* Logo (Text Removed, Only Image) */}
              <div>
                <img
                  src="/logo.png"
                  alt="Zoidics Logo"
                  className="h-30 w-auto object-contain brightness-0 invert"
                />
              </div>

              {/* Center Content */}
              <div className="max-w-lg">
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
                  <LockKeyhole size={22} className="text-[#ffb646]" />
                </div>

                <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-[#ffb646]">
                  Admin workspace
                </p>

                <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-white xl:text-5xl">
                  Manage your
                  <br />
                  digital presence.
                </h1>

                <p className="mt-6 max-w-md text-sm leading-relaxed font-medium text-white/50">
                  Manage projects, services, content and client enquiries from
                  one focused workspace.
                </p>
              </div>

              {/* Bottom */}
              <div className="flex items-center justify-between text-xs font-semibold text-white/30">
                <span>© {new Date().getFullYear()} Zoidics</span>
                <span>Secure Admin Access</span>
              </div>
            </div>
          </section>

          {/* =====================================================
              RIGHT SIDE (LOGIN FORM)
          ====================================================== */}
          <section className="flex min-h-screen items-center justify-center bg-white px-6 py-12 sm:px-10 lg:px-16 rounded-l-[2rem] lg:rounded-l-[3rem] shadow-[-20px_0_40px_rgba(0,0,0,0.05)]">
            <div className="w-full max-w-[420px]">
              {/* Mobile Logo (Text Removed, Only Image) */}
              <div className="mb-10 lg:hidden flex flex-col items-center sm:items-start">
                <img
                  src="/logo.png"
                  alt="Zoidics Logo"
                  className="h-10 w-auto object-contain"
                />
              </div>

              {/* Heading */}
              <div className="mb-10 text-center sm:text-left">
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#ff8a24]">
                  Welcome back
                </p>

                <h2 className="text-3xl font-bold tracking-tight text-[#080808]">
                  Sign in to your workspace
                </h2>

                <p className="mt-3 text-sm leading-6 font-medium text-black/50">
                  Enter your administrator credentials to continue.
                </p>
              </div>

              {/* ERROR MESSAGE */}
              {error && (
                <div
                  role="alert"
                  className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 shadow-sm"
                >
                  {error}
                </div>
              )}

              {/* LOGIN FORM */}
              <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                {/* EMAIL */}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-xs font-bold text-[#080808]/70 uppercase tracking-wide"
                  >
                    Email address
                  </label>

                  <div className="relative">
                    <Mail
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40"
                    />

                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        if (error) setError("");
                      }}
                      placeholder="admin@zoidics.com"
                      autoComplete="email"
                      disabled={loading}
                      className="h-14 w-full rounded-xl border border-black/10 bg-[#f9f9f9] pl-11 pr-4 text-sm font-semibold text-[#080808] outline-none transition-all placeholder:text-black/30 placeholder:font-medium hover:border-black/20 focus:bg-white focus:border-[#ffb646] focus:ring-4 focus:ring-[#ffb646]/10 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* PASSWORD */}
                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-xs font-bold text-[#080808]/70 uppercase tracking-wide"
                  >
                    Password
                  </label>

                  <div className="relative">
                    <LockKeyhole
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40"
                    />

                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => {
                        setPassword(event.target.value);
                        if (error) setError("");
                      }}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      disabled={loading}
                      className="h-14 w-full rounded-xl border border-black/10 bg-[#f9f9f9] pl-11 pr-12 text-sm font-semibold text-[#080808] outline-none transition-all placeholder:text-black/30 placeholder:font-medium hover:border-black/20 focus:bg-white focus:border-[#ffb646] focus:ring-4 focus:ring-[#ffb646]/10 disabled:cursor-not-allowed disabled:opacity-50"
                    />

                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-black/40 transition hover:bg-black/5 hover:text-[#080808] disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* SUBMIT */}
                <button
                  type="submit"
                  disabled={loading || success !== ""}
                  className="group mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#080808] text-sm font-bold text-white shadow-lg shadow-black/10 transition-all hover:bg-[#ffb646] hover:text-[#080808] hover:shadow-[#ffb646]/20 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      Sign in
                      <ArrowRight
                        size={18}
                        className="transition-transform duration-300 group-hover:translate-x-1"
                      />
                    </>
                  )}
                </button>
              </form>

              {/* FOOTER */}
              <div className="mt-10 border-t border-black/5 pt-6">
                <p className="text-center text-xs font-semibold text-black/30">
                  Authorized administrators only.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
