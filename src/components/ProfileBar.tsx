"use client";
import React from "react";
import { Avatar, CardContent, Typography } from "@mui/material";

import { useGetUser } from "@/hooks/user/useGetUser";
import Link from "next/link";

const ProfileBar = () => {
  const {
    data: user,
    isLoading: userLoading,
    isError: userError,
    error: userErr,
  } = useGetUser();

  if (userLoading)
    return <div className="bg-primary text-white p-6 mx-auto">Loading...</div>;
  if (userError)
    return (
      <div className="bg-primary text-white p-6 mx-auto">Error loading profile</div>
    );
  return (
    <div className="bg-primary py-2">
      <div className="rounded-none max-w-5xl mx-auto">
        <CardContent className="flex items-center gap-3 py-2! sm:py-4! last:pb-2! sm:last:pb-4!">
          <Link href="/">
            <Avatar className="h-12 w-12 outline-secondary/50 outline-3 shadow-md transition-transform hover:scale-105 bg-secondary! text-white font-bold text-lg">
              {user?.name?.charAt(0).toUpperCase()}
            </Avatar>
          </Link>

          <div className="flex flex-col leading-tight">
            <Link href="/">
              <p
                className="text-xl text-white font-semibold leading-[1]"
              >
                {user?.name}
              </p>
            </Link>
          </div>
          <div className="ml-auto">
            <Link
              href="/logout"
              className="text-gray-200 bg-[rgba(255,255,255,0.1)] border border-gray-300 px-4 py-2 text-sm font-semibold rounded-full  transition-colors"
            >
              Logout
            </Link>
          </div>
        </CardContent>
      </div>
    </div>
  );
};

export default ProfileBar;
