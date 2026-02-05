"use client"
import Link from 'next/link'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';

const Page = () => {
    const router = useRouter()

    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        phone: ""
    })
    const { name, email, password, phone } = form

    const handleSubmit = async () => {

        if (!name || !email || !password || !phone) {
            toast.error("All fields are required")
            return
        }
        if (phone.length < 10) {
            toast.error("Phone number must be at least 10 characters long")
            return
        }
        try {

            const res = await axios.post("/api/register", { email, password, name, phone })

            if (res?.data.success) {
                toast.success("Sign in completed")
                router.push("/login")
            }

        }
        catch (err) {
            console.log(err);
        }

    }

    return (
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-gray-50 px-4">
            <div
                className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg border border-gray-100 text-gray-900 "
            >
                <div className="mb-8 text-center">
                    <h2 className="text-2xl font-bold text-gray-900">Welcome </h2>
                    <p className="mt-2 text-sm text-gray-500">Please sign in to your account</p>
                </div>

                <div className="space-y-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                            Name
                        </label>
                        <div className="mt-1">
                            <input
                                id="name"
                                name="name"
                                value={name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                type="text"
                                placeholder="Your Name"
                                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Email Address
                        </label>
                        <div className="mt-1">
                            <input
                                id="email"
                                name="email"
                                value={email}
                                onChange={e => setForm({ ...form, email: e.target.value })}
                                type="email"
                                placeholder="you@example.com"
                                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm transition-all"
                            />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                            Phone
                        </label>
                        <div className="mt-1">
                            <input
                                id="phone"
                                name="phone"
                                value={phone}
                                maxLength={10}
                                // min={10}
                                // max={10}
                                onChange={e => setForm({ ...form, phone: e.target.value })}
                                type="phone"
                                placeholder="Your Phone Number"
                                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm transition-all"
                            />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                            Password
                        </label>
                        <div className="mt-1">
                            <input
                                id="password"
                                name="password"
                                value={password}
                                onChange={e => setForm({ ...form, password: e.target.value })}
                                type="password"
                                placeholder="••••••••"
                                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            onClick={handleSubmit}

                            className="flex w-full justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors"
                        >
                            Sign In
                        </button>
                    </div>

                    <p className="text-center text-sm">
                        Already Have an Account ?
                        <Link href='/login' className="text-blue-400 hover:text-blue-500 hover:underline"> Login</Link>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Page;
