"use client";

import useAddcontribution, {
  useGetContributions,
} from "@/hooks/contribution/useContribution";
import {
  useGetLoanByUserIdAndVentureId,
  useGetLoansByVentureId,
} from "@/hooks/loan/useLoan";
import {
  Card,
  CardContent,
  Typography,
  Divider,
  Chip,
  CircularProgress,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import UserPersonalLoan from "./UserPersonalLoan";

type Plan = {
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

type LoanData = {
  _id: string;
  vc_id: string;
  user_id: string;
  principal: number;
  interest_rate: number;
  months: number;
  status: string;
  approve_status: string;
  created_at: string;
  closed_at?: string;
};

export default function PlanCard({
  data,
  view,
  isAdmin,
}: {
  data: Plan;
  view?: string;
  isAdmin?: boolean;
}) {
  // View page
  const [open, setOpen] = useState<string | undefined>(view);
  const { mutateAsync: addContribution } = useAddcontribution(data._id);
  const {
    data: loans,
    isLoading: isLoadingLoans,
    refetch: refetchLoans,
  } = useGetLoanByUserIdAndVentureId(data._id);
  const [loanData, setLoanData] = useState<LoanData | null>(null);
  useEffect(() => {
    setLoanData(loans?.data);
  }, [loans]);
  // Router
  const router = useRouter();

  // View page
  const {
    data: contributionsData,
    isLoading: isLoadingContributions,
    refetch: refetchContributions,
  } = useGetContributions(data._id);

  // View page
  // Monthly Contribution Handler
  const handleAddContribution = async () => {
    try {
      const res = await addContribution();
      console.log(res);

      if (res.success) {
        toast.success(res.message);
        refetchContributions(); // Refetch contributions after adding
        setOpen(undefined);
      } else {
        toast.error(res.message);
      }
    } catch (error) {
      console.error("Error adding contribution:", error);
    }
  };
  // View page
  // Loan Handler
  const GetLoanHandler = () => {
    try {
      router.push(`/profile/get-loan?vc_id=${data._id}`);
    } catch (error) {}
  };

  // Admin
  // View Loan Handler For Admin
  const ViewLoanHandler = () => {
    try {
      router.push(`/profile/view-loan?vc_id=${data._id}`);
    } catch (error) {}
  };


  // User Pay Emi

 
  
  return (
    <Card className="w-full shadow-lg rounded-xl">
      <CardContent className="space-y-3 p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-1">
          <Typography
            variant="h6"
            fontWeight={600}
            className="text-base sm:text-lg"
          >
            {data.name.toUpperCase()}
          </Typography>
          <Chip
            label={`${data.max_loan_percent}% Loan`}
            color="primary"
            size="small"
          />
        </div>

        <Divider />

        {/* Details */}
        <div className="space-y-1 text-sm ">
          <p>
            <span className="font-medium">Currency Value:</span> ₹
            {data.currency}
          </p>

          <p>
            <span className="font-medium">Monthly Contribution:</span> ₹
            {data.monthly_contribution}
          </p>

          <p>
            <span className="font-medium">Loan Interest:</span>{" "}
            {data.loan_interest_percent}%
          </p>

          <p>
            <span className="font-medium">Wallet Balance:</span>{" "}
            {data.fund_wallet}
          </p>
          <p className="break-all">
            <span className="font-medium">VC ID:</span>{" "}
            <span className="text-xs sm:text-sm">{data._id}</span>
          </p>
        </div>

        <Divider />

        {/* My Loan Status */}
       <UserPersonalLoan loanData={loanData} isLoadingLoans={isLoadingLoans} />

        <Divider />

        <div className="space-y-2">
          <Typography variant="subtitle2" fontWeight={600}>
            My Contribution Status
          </Typography>
          {isLoadingContributions ? (
            <div className="flex justify-center py-2">
              <CircularProgress size={20} />
            </div>
          ) : contributionsData?.data && contributionsData.data.length > 0 ? (
            <div className="space-y-1 text-sm">
              {contributionsData.data.map((contribution) => (
                <div
                  key={contribution._id}
                  className="flex flex-wrap items-center justify-between gap-2 bg-gray-50 p-2 sm:p-3 rounded"
                >
                  <span className="text-xs sm:text-sm">
                    {contribution.month}/{contribution.year}
                  </span>
                  <span className="text-xs sm:text-sm">
                    ₹{contribution.amount}
                  </span>
                  <Chip
                    label={contribution.status}
                    color={
                      contribution.status === "PAID" ? "success" : "warning"
                    }
                    size="small"
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No contributions yet</p>
          )}
        </div>

        <Divider />

        {/* THis is For View Page */}
        {open !== undefined && (
          <div className="text-sm py-3 border-b border-gray-200">
            <button
              onClick={GetLoanHandler}
              className="w-full sm:w-auto bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98] px-4 py-3 sm:py-2 rounded-lg font-medium transition-all"
            >
              Get Loan
            </button>
          </div>
        )}

        {/* Footer */}

        <div className="text-xs text-gray-500 space-y-3 sm:space-y-1 flex flex-col sm:flex-row sm:justify-between py-2">
          <div className="space-y-0.5">
            <p>
              <strong>Created:</strong>{" "}
              {new Date(data.created_at).toLocaleDateString()}
            </p>
            <p>
              <strong>Updated:</strong>{" "}
              {new Date(data.updated_at).toLocaleDateString()}
            </p>
          </div>

          {open !== undefined &&
            !contributionsData?.data?.some((c) => c.status === "PAID") && (
              <div className="text-sm mt-2 sm:mt-0">
                <button
                  onClick={handleAddContribution}
                  className="w-full sm:w-auto bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98] px-4 py-3 sm:py-2 rounded-lg font-medium transition-all"
                >
                  Add Contribution
                </button>
              </div>
            )}

          {/* THis is For Admin Page */}
          {isAdmin && (
            <div className="text-sm mt-2 sm:mt-0">
              <button
                onClick={ViewLoanHandler}
                className="w-full sm:w-auto bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98] px-4 py-3 sm:py-2 rounded-lg font-medium transition-all"
              >
                View Loan Reqestes
              </button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
