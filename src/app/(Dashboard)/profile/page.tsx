"use client";

import PlanCard from "@/components/PlanCard";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { Card, CardContent, Typography, Divider, Avatar } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { getVenture } from "@/hooks/venture/useVenture";
import { useGetUser } from "@/hooks/user/useGetUser";

type Venture = {
  _id: string;
  name: string;
  currency: string;
  fund_wallet: number;
  monthly_contribution: number;
  loan_interest_percent: number;
  max_loan_percent: number;
  created_by: string;
  created_at: string;
  updated_at: string;
};

const Page = () => {
  const {
    data: user,
    isLoading: userLoading,
    isError: userError,
    error: userErr,
  } = useGetUser();

  const {
    data: ventureData,
    isLoading: ventureLoading,
    isError: ventureError,
    error: ventureErr,
  } = useQuery({
    queryKey: ["venture"],
    queryFn: getVenture,
  });

  if (userLoading || ventureLoading) return <p>Loading...</p>;

  if (userError) return <p>{(userErr as Error).message}</p>;
  if (ventureError) return <p>{(ventureErr as Error).message}</p>;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <Card>
        <CardContent className="flex gap-6 items-center">
          <Avatar>{user?.name?.charAt(0)}</Avatar>
          <div>
            <Typography variant="h6">{user?.name}</Typography>
            <Typography>{user?.email}</Typography>
            <Typography className="text-gray-600">
              Phone: {user?.phone}
            </Typography>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ventureData?.map((item: Venture) => (
          <PlanCard key={item._id} data={item} isAdmin={true} />
        ))}
      </div>
    </div>
  );
};

export default Page;
