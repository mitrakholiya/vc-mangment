"use client";
import Link from "next/link";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import { Input } from "@/components/Input";
import { CircularProgress } from "@mui/material";

const Page = () => {
  const router = useRouter();
  const [isLoading,setIsLoading] = useState(false);

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
    setIsLoading(false);
  };

  if (isLoading) {
return(<>
<div className="h-screen w-full flex justify-center items-center">
          <CircularProgress />
</div>
</>)
  } 
  
  return (
    <div className="flex h-[100dvh] sm:items-center items-end justify-center sm:bg-background bg-primary sm:px-4">
      <div className="w-full max-w-md rounded-[30px_30px_0_0] sm:rounded-xl bg-white p-8 shadow-lg border border-gray-100 text-gray-900">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 font-secondary ">Create
            
            <span className="text-primary"> Account</span></h2>
          <p className="mt-2 text-sm text-gray-500">
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
              className="flex w-full justify-center rounded-md bg-primary px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors"
            >
              Sign Up
            </button>
          </div>

          <p className="text-center text-sm">
            Already Have an Account ?
            <Link
              href="/login"
              className="text-secondary hover:text-secondary/80 hover:underline"
            >
              {" "}
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Page;
