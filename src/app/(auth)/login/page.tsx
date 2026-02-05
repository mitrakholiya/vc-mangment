"use client"; // must be first
import Link from "next/link";
import React, { useState } from "react";
import { useRouter } from "next/navigation"; // correct import
import axios from "axios";
import toast from "react-hot-toast";

const Login = () => {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [pass, setPass] = useState("");

    const handleSubmit = async () => {
        const res = await axios.post("/api/login", { email, password: pass })
        if (res?.data?.success) {
            toast.success("Login Compaleted")
            router.push("/")

        }else{
            toast.error("User is Not Found Plase Sing in Frist")
            router.push("/register")
        }
    };

    return (
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-gray-50 px-4">
            <div
                className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg border border-gray-100 text-gray-900"
            >
                <div className="mb-8 text-center">
                    <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
                    <p className="mt-2 text-sm text-gray-500">Please Login to your account</p>
                </div>

                <div className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-900">
                            Email Address
                        </label>
                        <div className="mt-1">
                            <input
                                id="email"
                                name="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                type="email"
                                placeholder="you@example.com"
                                className="block w-full text-black rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-900">
                            Password
                        </label>
                        <div className="mt-1">
                            <input
                                id="password"
                                name="password"
                                value={pass}
                                onChange={e => setPass(e.target.value)}
                                type="password"
                                placeholder="••••••••"
                                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            className="flex w-full justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors"
                            onClick={handleSubmit}

                        >
                            Log In
                        </button>
                    </div>

                    <p className="text-center text-sm">
                        Don’t Have an Account ?
                        <Link href='/register' className="text-blue-400 hover:text-blue-500 hover:underline">
                            Register
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
