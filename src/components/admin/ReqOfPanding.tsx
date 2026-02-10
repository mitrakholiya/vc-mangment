"use client";

import { useGetReqestTopanding } from "@/hooks/contribution/useContribution"; // Correct hook import
import { usePathname } from "next/navigation";
import React from "react";
import { toast } from "react-hot-toast";
import api from "@/lib/axios";
import { useQueryClient, useMutation } from "@tanstack/react-query";

interface RequestUser {
  _id: string;
  name: string;
  email: string;
}

interface RequestData {
  _id: string;
  user_id: RequestUser; // Populated user object
  month: number;
  year: number;
  monthly_contribution: number;
  status: string;
}

export default function ReqOfPanding() {
  const pathname = usePathname();
  // Extract VC ID from URL (e.g. /view-venture/123)
  const vc_id = pathname.split("/").pop() || "";
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useGetReqestTopanding(vc_id);

  // Approve Mutation
  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.put(`/venture/request-to-pending/${id}`, { vc_id });
      return res.data;
    },
    onSuccess: (res) => {
      if (res.success) {
        toast.success(res.message);
        queryClient.invalidateQueries({
          queryKey: ["reqest-to-pending", vc_id],
        });
      } else {
        toast.error(res.message);
      }
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Something went wrong");
    },
  });

  if (isLoading) {
    return (
      <div className="p-4 text-center text-gray-500 text-sm">
        Loading requests...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500 text-sm">
        Error loading requests
      </div>
    );
  }

  const requests: RequestData[] = data?.data || [];

  if (requests.length === 0) {
    return (
      <div className="p-8 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
        <p className="text-gray-500 text-sm">No pending requests found</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700">
          Pending Approvals
        </h3>
      </div>

      <div className="divide-y divide-gray-100">
        {requests.map((req) => (
          <div
            key={req._id}
            className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-gray-900">
                {req.user_id?.name || "Unknown User"}
              </span>
              <span className="text-xs text-gray-500">
                {getMonthName(req.month)} {req.year} • ₹
                {req.monthly_contribution}
              </span>
            </div>

            <button
              onClick={() => approveMutation.mutate(req._id)}
              disabled={approveMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {approveMutation.isPending ? "..." : "Approve"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

const getMonthName = (month: number) => {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return months[month - 1] || "";
};
