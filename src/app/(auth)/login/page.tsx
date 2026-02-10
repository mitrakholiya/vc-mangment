"use client"; // must be first
import Link from "next/link";
import React, { useState } from "react";
import { useRouter } from "next/navigation"; // correct import
import axios from "axios";
import toast from "react-hot-toast";
import { Input } from "@/components/Input";

const Login = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");

  const handleSubmit = async () => {
    const res = await axios.post("/api/login", { email, password: pass });
    if (res?.data?.success) {
      toast.success("Login Compaleted");
      router.push("/profile");
    } else {
      toast.error("User is Not Found Plase Sing in Frist");
      router.push("/register");
    }
  };

  return (
    <div className="flex h-screen sm:items-center items-end justify-center sm:bg-background bg-secondary sm:px-4">
      <div className="w-full max-w-md rounded-[30px_30px_0_0] sm:rounded-xl bg-white p-8 shadow-lg border border-gray-100 text-gray-900">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
          <p className="mt-2 text-sm text-gray-500">
            Please Login to your account
          </p>
        </div>

        <div className="space-y-6">
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
              className="flex w-full justify-center rounded-md bg-secondary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors"
              onClick={handleSubmit}
            >
              Log In
            </button>
          </div>

          <p className="text-center text-sm">
            Don’t Have an Account ?
            <Link
              href="/register"
              className="text-blue-400 hover:text-blue-500 hover:underline"
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
