"use client";

import Link from "next/link";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import { Input } from "@/components/Input";
import Image from "next/image";
import Loading from "@/components/Loading";
import LoginBackground from "@/components/LoginBackground";

const Login = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await axios.post("/api/login", {
        email,
        password: pass,
      });

      if (res?.data?.success) {
        toast.success("Login Completed");
        router.push("/");
      } else {
        toast.error("User not found. Please sign up first.");
        router.push("/register");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <Loading />;

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden">
      {/* Background */}
      <LoginBackground />

      {/* Logo */}
      <div className="relative z-20 mb-6 sm:mb-10">
        <Image
          src="/icons/syncera.png"
          alt="Syncera logo"
          width={180}
          height={180}
          className="object-contain mx-auto w-[140px] sm:w-[180px]"
          priority
        />
      </div>

      {/* Login Card */}
      <div className="relative z-20 w-full max-w-md rounded-2xl bg-white/95 backdrop-blur-md p-6 sm:p-8 shadow-2xl border border-white/20">
        <div className="mb-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 font-secondary">
            Welcome <span className="text-primary">Back</span>
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Please login to your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            type="email"
            placeholder="Enter Your Email"
            value={email}
            setValue={setEmail}
          />

          <Input
            type="password"
            placeholder="Enter Your Password"
            value={pass}
            setValue={setPass}
          />

          <button
            type="submit"
            className="w-full rounded-md bg-primary py-3 font-semibold uppercase text-white shadow-md transition hover:scale-[1.02]"
          >
            Log In
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Don’t have an account?{" "}
          <Link
            href="/register"
            className="text-secondary underline hover:text-secondary/80"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
