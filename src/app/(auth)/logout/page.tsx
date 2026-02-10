"use client"
import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { CircularProgress } from '@mui/material'

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
        <div className='h-screen w-full flex justify-center items-center'>
            <CircularProgress />    
        </div>
    )
}

export default Logout

