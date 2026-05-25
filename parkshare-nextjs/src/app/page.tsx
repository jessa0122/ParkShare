"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

import { createClient } from "@/utils/supabase/client";

export default function LoginPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    const supabase = createClient();
    // Use NEXT_PUBLIC_SITE_URL so the redirectTo always points to the real
    // production domain on Vercel, not an internal serverless origin.
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin).replace(/\/$/, "");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${siteUrl}/auth/callback?next=/driver`,
      },
    });
    if (error) console.error("Google auth error:", error.message);
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const supabase = createClient();

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      const user = data.user;

      // Query profiles table as the authoritative role source
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      const role = profile?.role ?? user?.user_metadata?.role;

      if (role === "host") {
        router.push("/host/slots");
        return;
      }

      // Default: treat as driver
      router.push("/driver");
    } catch (authError) {
      const message =
        authError instanceof Error
          ? authError.message
          : "Unable to sign in. Please check your credentials and try again.";

      alert(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(rgba(31,43,143,0.82),rgba(31,43,143,0.82)),url('/images/sm-lanang-premier.jpg')] bg-cover bg-center px-4">
      <div className="w-full max-w-[430px] rounded-[28px] bg-white p-8 shadow-2xl">
        <div className="mb-4 flex justify-center">
          <Image src="/logo.png" alt="ParkShare" width={125} height={40} priority />
        </div>

        <h1 className="text-center text-[38px] font-black leading-tight text-[#1E2A78]">
          Welcome to ParkShare
        </h1>

        <p className="mx-auto mt-3 max-w-[320px] text-center text-base leading-7 text-gray-500">
          Find and reserve parking spaces before you arrive.
        </p>

        <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-2xl border border-gray-300 px-5 py-3 text-base outline-none focus:border-cyan-400"
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-gray-300 px-5 py-3 pr-14 text-base outline-none focus:border-cyan-400"
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#1E2A78]"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-2xl bg-cyan-400 py-3 text-lg font-bold text-white transition hover:bg-cyan-500"
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs text-slate-400">
              <span className="bg-white px-2">or</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full rounded-xl border border-slate-200 py-2.5 flex items-center justify-center gap-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 shadow-sm"
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              className="h-4 w-4"
              alt="Google logo"
            />
            Continue with Google
          </button>

          <Link
            href="/auth/signup"
            className="block w-full rounded-2xl border-2 border-[#1E2A78] py-3 text-center text-lg font-bold text-[#1E2A78]"
          >
            Sign Up
          </Link>
        </form>

        <div className="mt-6 border-t border-gray-100 pt-5 text-center">
          <p className="text-sm text-gray-400">Are you a parking host?</p>
          <Link
            href="/auth/login/host"
            className="mt-1 inline-block text-sm font-bold text-park-teal hover:underline"
          >
            Sign in to the Host Portal →
          </Link>
        </div>
      </div>
    </main>
  );
}
