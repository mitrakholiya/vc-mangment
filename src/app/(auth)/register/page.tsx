"use client";
import Link from "next/link";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import { Input } from "@/components/Input";
import { CircularProgress } from "@mui/material";

import Image from "next/image";
import LoginBackground from "@/components/LoginBackground";

const Page = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });
  const { name, email, password, phone } = form;

  const handleSubmit = async () => {
    if (!name || !email || !password || !phone) {
      toast.error("All fields are required");
      return;
    }
    if (phone.length < 10) {
      toast.error("Phone number must be at least 10 characters long");
      return;
    }
    try {
      setIsLoading(true);
      const res = await axios.post("/api/register", {
        email,
        password,
        name,
        phone,
      });
      setIsLoading(false);
      if (res?.data.success) {
        toast.success("Registration completed");
        router.push("/login");
      }
    } catch (err) {
      console.log(err);
      toast.error("Something went wrong");
    }
    // setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full flex justify-center items-center">
        <CircularProgress />
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh]  flex-col  items-center sm:justify-evenly justify-center bg-transparent sm:px-4 relative">
      <div className="sm:relative absolute inset-0  z-[1] sm:top-0 top-[80px]  ">
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
      {/* <div className="absolute inset-0 bg-background z-[-2]"></div> */}
      <LoginBackground />

      <div className="w-[90%] sm:w-1/2 max-w-md rounded-xl backdrop-blur-md bg-white p-8 shadow-lg border border-gray-100 text-gray-900 mt-[200px] sm:mt-[0px] relative z-[10]">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold! text-gray-900 font-secondary">
            Create
            <span className="text-primary"> Account</span>
          </h2>
          <p className="mt-2 text-sm text-gray-700">
            Please register to create your account
          </p>
        </div>

        <div className="space-y-4 sm:space-y-6">
          <div>
            <div className="mt-1">
              <Input
                type="text"
                placeholder="Your Name"
                value={name}
                setValue={(val) => setForm({ ...form, name: val })}
              />
            </div>
          </div>

          <div>
            <div className="mt-1">
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                setValue={(val) => setForm({ ...form, email: val })}
              />
            </div>
          </div>
          <div>
            <div className="mt-1">
              <Input
                type="text"
                placeholder="Your Phone Number"
                value={phone}
                setValue={(val) => setForm({ ...form, phone: val })}
              />
            </div>
          </div>
          <div>
            <div className="mt-1">
              <Input
                type="password"
                placeholder="Enter Your Password"
                value={password}
                setValue={(val) => setForm({ ...form, password: val })}
              />
            </div>
          </div>

          <div>
            <button
              onClick={handleSubmit}
              className="flex w-full justify-center rounded-md bg-primary px-4 py-3 uppercase font-semibold text-white shadow-sm transition-all hover:scale-105 duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
            >
              Sign Up
            </button>
          </div>

          <p className="text-center text-sm text-gray-700">
            Already Have an Account ?{" "}
            <Link
              href="/login"
              className="text-secondary/80 hover:text-secondary underline"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Page;
