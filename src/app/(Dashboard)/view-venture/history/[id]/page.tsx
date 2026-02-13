"use client";
import React from "react";
import ViewHistory from "@/components/admin/ViewHistory";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@mui/material";

const HistoryPage = () => {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div
          className="flex items-center gap-2 cursor-pointer rounded-full p-2 bg-primary hover:bg-primary/80 transition-colors"
          onClick={() => router.back()}
        >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="white"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
              />
            </svg>
        </div>
      </div>

      <ViewHistory id={id} />
    </div>
  );
};

export default HistoryPage;
