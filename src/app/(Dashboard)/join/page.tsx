
"use client"
import React, { useState } from 'react'
import { joinVc } from '@/hooks/membership/joinMember'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

const page = () => {

    const router = useRouter()
    const [id, setId] = useState('')

    const HandelJoin =async () => {
        console.log("click", id);

        const res = await joinVc(id)
        if(res.success === true){
            toast.success(res.message)
            router.push('/profile')
        }else{
            toast.error(res.message)
        }
    }
    return (
        <div>
            <input type="text"
            className='border border-gray-300 rounded-md p-2'
                value={id}
                onChange={e => setId(e.target.value)}
                placeholder='Enter VC ID'
            />
            <button
                onClick={HandelJoin}
            >Join</button>
        </div>
    )
}

export default page