"use client"
import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";

export default function Home() {

  
  return (
    <div className="max-h-full flex flex-col items-center justify-center gap-[20px]">
      HOME PAGE

      <Link href="/venture">
        <button className="bg-indigo-600 px-[30px] py-[6px] rounded">Create VC</button>
      </Link>
    </div>
  );
}
