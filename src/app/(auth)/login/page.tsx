"use client"; // must be first
import Link from "next/link";
import React, { useState } from "react";
import { useRouter } from "next/navigation"; // correct import
import axios from "axios";
import toast from "react-hot-toast";
import { Input } from "@/components/Input";
import { CircularProgress } from "@mui/material";

const Login = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");

  const handleSubmit = async () => {
    setIsLoading(true);
    const res = await axios.post("/api/login", { email, password: pass });
    if (res?.data?.success) {
      toast.success("Login Compaleted");
      // router.push("/profile");
      router.push("/");
    } else {
      toast.error("User is Not Found Plase Sing in Frist");
      router.push("/register");
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full flex justify-center items-center">
        <CircularProgress />
      </div>
    );
  }
  return (
    <div className="flex h-[100dvh] sm:items-center items-end justify-center sm:bg-background bg-primary sm:px-4">
      <div className="w-full max-w-md rounded-[30px_30px_0_0] sm:rounded-xl bg-white p-8 shadow-lg border border-gray-100 text-gray-900">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 font-secondary">
            Welcome&nbsp;
            <span className="text-primary">Back</span>
          </h2>
          <p className="mt-2 text-sm text-gray-700">
            Please Login to your account
          </p>
        </div>

        <div className="space-y-6 text-primary">
          <div className="mt-1">
            <Input
              type="email"
              placeholder="Enter Your Email"
              value={email}
              setValue={setEmail}
            />
          </div>

          <div>
            <Input
              type="password"
              placeholder="Enter Your Password"
              value={pass}
              setValue={setPass}
            />
          </div>

          <div>
            <button
              className="flex w-full justify-center rounded-md bg-primary px-4 py-3 uppercase  font-semibold text-white shadow-sm transition-transform hover:scale-105 duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary transition-colors"
              onClick={handleSubmit}
            >
              Log In
            </button>
          </div>

          <p className="text-center text-sm text-gray-700  ">
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
    </div>
  );
};

export default Login;
