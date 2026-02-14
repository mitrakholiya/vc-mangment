"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { CircularProgress } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";

const Logout = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    const logoutHandler = async () => {
      try {
        // Call logout API
        const response = await axios.post("/api/logout");

        if (response.status === 200) {
          // ⚡ Clear ALL React Query cache
          queryClient.clear();

          // Clear localStorage (if any)
          localStorage.clear();

          // Clear sessionStorage (if any)
          sessionStorage.clear();

          // Redirect to login
          router.push("/login");
        }
      } catch (error) {
        console.error("Logout error:", error);
        // Even if API fails, clear cache and redirect
        queryClient.clear();
        localStorage.clear();
        sessionStorage.clear();
        router.push("/login");
      }
    };
    logoutHandler();
  }, [router, queryClient]);

  return (
    <div className="h-screen w-full flex justify-center items-center">
      <CircularProgress />
    </div>
  );
};

export default Logout;
