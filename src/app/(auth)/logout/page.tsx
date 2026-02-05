"use client"
import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'

const Logout = () => {
    const router = useRouter()
    useEffect(() => {
        const logoutHandler = async () => {
            const response = await axios.post("/api/logout")
            if (response.status === 200) {
                router.push("/login")
            }
        }
        logoutHandler()
    }, [])

    return (
        <div>
            Loding...
        </div>
    )
}

export default Logout

