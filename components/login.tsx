"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { AlertCircle, ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useRecruitAuth } from "@/contexts/RecruitAuthContext";

export function Login() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading, signIn } = useRecruitAuth();
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const redirectTo = searchParams.get("redirect") || "/store";

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated) {
      router.replace(redirectTo);
    }
  }, [isAuthenticated, isLoading, redirectTo, router]);

  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitting(true);

    const result = await signIn(loginEmail, loginPassword);
    setSubmitting(false);

    if (!result.success) {
      setSubmitError(result.error || "Login failed. Please try again.");
      return;
    }

    router.replace(redirectTo);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-[#05010d] flex items-center justify-center text-white">
        <div className="text-sm text-white/60">Checking session...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#05010d] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="bg-neutral-900/80 ring-1 ring-white/10 backdrop-blur-md p-6 md:p-8 rounded-2xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Lock className="w-32 h-32 text-white" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-2 relative z-10">
            Member Login
          </h2>
          <p className="text-slate-400 mb-6 relative z-10 text-sm md:text-base">
            Sign in to access the platform.
          </p>

          <form onSubmit={handleLoginSubmit} className="space-y-4 relative z-10" autoComplete="on">
            <div className="relative group">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within:text-white transition-colors" />
              <input
                autoFocus
                type="email"
                name="email"
                id="login-email"
                autoComplete="username"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="Email Address"
                className="w-full bg-black/40 border border-white/15 rounded-xl pl-10 pr-4 py-3.5 md:py-4 text-white placeholder-white/40 focus:outline-none focus:border-white/60 transition-all text-base"
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within:text-white transition-colors" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                id="login-password"
                autoComplete="current-password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-black/40 border border-white/15 rounded-xl pl-10 pr-12 py-3.5 md:py-4 text-white placeholder-white/40 focus:outline-none focus:border-white/60 transition-all text-base"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {submitError && (
              <div className="text-red-400 text-sm bg-red-950/30 p-3 rounded-lg flex items-center gap-2 border border-red-500/20">
                <AlertCircle className="w-4 h-4" /> {submitError}
              </div>
            )}

            <button
              type="submit"
              disabled={!loginEmail || !loginPassword || submitting}
              className="w-full py-3.5 md:py-4 bg-white text-black rounded-xl font-bold tracking-wide transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:bg-neutral-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-base"
            >
              {submitting ? "LOGGING IN..." : "LOGIN"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 text-center border-t border-white/5 pt-4">
            <Link href="/register/pagemode" className="text-sm text-slate-500 hover:text-white transition-colors">
              Don't have a password? <span className="underline">Register Now</span>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
