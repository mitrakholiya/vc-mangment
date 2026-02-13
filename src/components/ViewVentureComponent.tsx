"use client";

import React, { useState } from "react";
import JoinRequestsPopup from "./JoinRequestsPopup";
import { useRequestToPending } from "@/hooks/contribution/useContribution";
import toast from "react-hot-toast";
import Link from "next/link";

interface VentureData {
  name: string;
  month: number;
  year: number;
  interest_rate: number;
  isAdmin: boolean;
  loan_repayment_percent: number;
  requests: string[];
  total_interest_amount: number;
  total_loan_amount: number;
  monthly_hapto: number;

  total_remaining_amount: number;
  total_repayment_amount: number;
  loan_part_payment: number;
  status: string;
  user_id: string;
  vc_id: string;
}

interface ViewVentureComponentProps {
  data: VentureData;
  onPay?: () => void;
  onLoanPayment?: (amount: number) => void;
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

const getStatusColor = (status: string) => {
  switch (status) {
    case "paid":
    case "approved":
      return "bg-green-100 text-green-700";
    case "pending":
      return "bg-yellow-100 text-yellow-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
};

export default function ViewVentureComponent({
  data,
  // onPay,
  // onLoanPayment,
}: ViewVentureComponentProps) {
  const [loanAmount, setLoanAmount] = useState("");
  const [reqpopup, setReqpopup] = useState(false);

  const { mutateAsync: requestTopanding, isPending } = useRequestToPending(
    data?.vc_id || "",
  );

  // const handleRequestToPending = async () => {
  //   if (!data?.vc_id) return;
  //   try {
  //     const res = await requestTopanding();
  //     if (res?.success) {
  //       toast.success(res.message);
  //     } else {
  //       toast.error(res.message);
  //     }
  //   } catch (error: any) {
  //     toast.error(error?.message || "Something went wrong");
  //   }
  // };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  if (!data) return null;

  return (
    <div className="w-full px-1 py-2">
      {/* Card */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200">
        {/* Header */}
        <div className="bg-primary rounded-t-xl px-4 py-3">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-white">{data.name}</h2>
              <div
                className="flex items-center gap-1.5 cursor-pointer group w-fit pt-1"
                onClick={() => handleCopy(data?.vc_id)}
              >
                <h2 className=" font-semibold text-white text-md">
                  VC ID : {data.vc_id.slice(0, 3)}...
                </h2>
                <div className=" rounded-sm bg-secondary/20 p-1 ">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-secondary/60 group-hover:scale-110 transition-transform"
                  >
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                  </svg>
                </div>
              </div>
              {data.month && data.year && (
                <p className="text-gray-200 text-[16px] py-1">
                  {getMonthName(data.month)} {data.year}
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-1">
              {/* {data.isAdmin && (
                <span className=" text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded">
                  ADMIN
                </span>
              )} */}
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded capitalize ${getStatusColor(data.status)}`}
              >
                {data.status || "none"}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="">
          {/* Unified Stats */}
          <div className="bg-gray-50 rounded-lg p-2.5 space-y-2 font-semibold">
            <div className="flex justify-between text-[16px]">
              <span className="text-gray-700">Monthly Hapto</span>
              <span className="font-extrabold text-primary">
                ₹{data.monthly_hapto?.toLocaleString() || 0}
              </span>
            </div>

            <div className="flex justify-between text-[16px]">
              <span className="text-gray-700">Loan Amount</span>
              <span className="font-extrabold text-primary">
                ₹{data.total_loan_amount?.toLocaleString() || 0}
              </span>
            </div>

            <div className="flex justify-between text-[16px]">
              <span className="text-gray-700">Remaining Loan</span>
              <span className="font-extrabold text-primary">
                ₹{data.total_remaining_amount?.toLocaleString() || 0}
              </span>
            </div>

            <div className="flex justify-between text-[16px]">
              <span className="text-gray-700">
                Interest (
                  <span className="text-secondary font-extrabold">{data.interest_rate}%</span>
                )
              </span>
            <span className="font-extrabold text-primary">
                ₹{data.total_interest_amount?.toLocaleString() || 0}
              </span>
            </div>

            <div className="flex justify-between text-[16px]  ">
              <span className="text-gray-700">Part Payment</span>
              <span className="font-extrabold text-primary">
                ₹{data.loan_part_payment?.toLocaleString() || 0}
              </span>
            </div>

            <div className="flex justify-between text-[16px] border-t py-2 border-gray-400">
              <span className="text-secondary">Total Repayment</span>
              <span className="font-extrabold text-secondary">
                ₹{data.total_repayment_amount?.toLocaleString() || 0}
              </span>
            </div>


            <div className="flex justify-between text-lg">
              <Link
                href={`/view-venture/history/${data.vc_id}`}
                className="bg-primary text-white w-full text-center rounded-xl p-3"
              >
                History
              </Link>
            </div>
          </div>

          {/* Loan Part Payment */}
          {/* {data.total_remaining_amount > 0 && (
            <div className="bg-purple-50 border border-purple-100 rounded-lg p-3">
              <p className="text-xs text-purple-700 font-medium mb-2">
                Pay Loan Amount
              </p>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="flex-1 px-3 py-2 text-sm border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
                <button
                  onClick={handleLoanPayment}
                  disabled={!loanAmount || parseFloat(loanAmount) <= 0}
                  className="bg-purple-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Pay
                </button>
              </div>
            </div>
          )} */}

          {/* Admin Badge */}
          {data.isAdmin && data.requests?.length > 0 && (
            <div
              className="flex justify-between items-center bg-blue-50 border border-blue-100 rounded-lg px-3 py-2"
              onClick={() => {
                setReqpopup(!reqpopup);
              }}
            >
              <span className="text-xs text-blue-700">Pending Requests</span>
              <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded">
                {data.requests.length}
              </span>
            </div>
          )}

          {/* Pay Button */}
          {/* <button
            onClick={handleRequestToPending}
            disabled={isPending}
            className="w-full bg-gray-900 text-white font-medium py-2.5 rounded-lg hover:bg-gray-800 active:scale-[0.98] transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? "Processing..." : "Pay Monthly Hapto"}
          </button> */}
        </div>

        <JoinRequestsPopup
          open={reqpopup}
          onClose={() => setReqpopup(false)}
          requests={data.requests}
          ventureId={data.vc_id}
        />
      </div>
    </div>
  );
}
