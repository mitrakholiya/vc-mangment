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
    return <div className="bg-primary text-white p-4">Loading...</div>;
  if (userError)
    return (
      <div className="bg-primary text-white p-4">Error loading profile</div>
    );
  return (
    <div className="bg-primary">
      <div className="rounded-none max-w-5xl mx-auto">
        <CardContent className="flex items-center gap-3 py-2! sm:py-4! last:pb-2! sm:last:pb-4!">
          <Link href="/profile">
            <Avatar className="h-12 w-12 border-2 border-white shadow-md transition-transform hover:scale-105 bg-secondary! text-white font-bold text-lg">
              {user?.name?.charAt(0).toUpperCase()}
            </Avatar>
          </Link>

          <div className="flex flex-col leading-tight">
            <Link href="/profile">
              <Typography
                variant="h6"
                className="text-sm text-white font-semibold"
              >
                {user?.name}
              </Typography>
            </Link>
          </div>
          <div className="ml-auto">
            <Link
              href="/logout"
              className="text-gray-700 bg-white border border-gray-300 px-4 py-2 text-sm font-semibold rounded-full hover:bg-gray-50 transition-colors"
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
