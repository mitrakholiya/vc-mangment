"use client"; // must be first
import Link from "next/link";
import React, { useState } from "react";
import { useRouter } from "next/navigation"; // correct import
import axios from "axios";
import toast from "react-hot-toast";
import { Input } from "@/components/Input";
import { CircularProgress } from "@mui/material";
import Image from "next/image";
import { useQueryClient } from "@tanstack/react-query";

const Login = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // stop page reload
    setIsLoading(true);

    try {
      const res = await axios.post("/api/login", {
        email,
        password: pass,
      });

      if (res?.data?.success) {
        // ⚡ Clear old user's cached data
        queryClient.clear();

        toast.success("Login Completed");
        router.push("/");
      } else {
        toast.error("User not found. Please sign up first.");
        router.push("/register");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-[100dvh]  flex-col  items-center sm:justify-evenly justify-center bg-transparent sm:px-4 relative">
      <div className="  ">
        <div className="flex w-full justify-center">
          <Image
            src="/icons/syncera.png"
            alt="Syncera logo"
            width={200}
            height={200}
            className="object-contain"
            priority
          />
        </div>
      </div>
      {/* <LoginBackground /> */}
      <div className="absolute inset-0 bg-background z-[-2]"></div>

      <div className="w-[90%] sm:w-1/2 max-w-md rounded-2xl bg-white p-8 shadow-2xl border border-white/20 text-gray-900 sm:mt-0 mt-[20px] relative z-[10]">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold! text-gray-900 font-secondary">
            Welcome&nbsp;
            <span className="text-primary">Back</span>
          </h2>
          <p className="mt-2 text-sm text-gray-700">
            Please Login to your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 text-primary">
          <div className="mt-1">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              setValue={setEmail}
            />
          </div>

          <div>
            <Input
              type="password"
              placeholder="Password"
              value={pass}
              setValue={setPass}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full justify-center items-center gap-2 rounded-md bg-primary px-4 py-3 uppercase font-semibold text-white shadow-sm transition-all hover:scale-105 duration-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isLoading && <CircularProgress size={16} color="inherit" />}
            {isLoading ? "Logging in..." : "Log In"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-700 pt-[20px]  ">
          Don’t Have an Account ?{" "}
          <Link
            href="/register"
            className="text-secondary/80 hover:text-secondary underline"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
