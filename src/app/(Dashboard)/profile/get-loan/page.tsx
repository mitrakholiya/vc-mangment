"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useGetVentureById } from "@/hooks/venture/useGetVentureById";
import { useCreateLoan } from "@/hooks/loan/useLoan";
import {
  Card,
  CardContent,
  Typography,
  Divider,
  CircularProgress,
  TextField,
  Slider,
  Box,
  Alert,
} from "@mui/material";
import toast from "react-hot-toast";

export default function GetLoanPage() {
  const searchParams = useSearchParams();
  const vc_id = searchParams.get("vc_id");

  // Fetch venture details
  const { data: venture, isLoading, isError } = useGetVentureById(vc_id);

  // Loan mutation
  const { mutateAsync: createLoan, isPending } = useCreateLoan();

  // Form state
  const [loanAmount, setLoanAmount] = useState<number>(0);
  const [months, setMonths] = useState<number>(6);

  // Calculate values
  const maxLoanAmount = venture
    ? (venture.fund_wallet * venture.max_loan_percent) / 100
    : 0;
  const interestRate = venture?.loan_interest_percent || 0;
  const totalInterest = (loanAmount * interestRate * months) / 100;
  const totalRepayment = loanAmount + totalInterest;
  const monthlyEMI = totalRepayment / months;

  // Handle loan request
  const handleLoanRequest = async () => {
    if (!vc_id || loanAmount <= 0 || months <= 0) {
      toast.error("Please enter valid loan details");
      return;
    }

    if (loanAmount > maxLoanAmount) {
      toast.error(`Loan amount cannot exceed ₹${maxLoanAmount.toFixed(2)}`);
      return;
    }

    try {
      const res = await createLoan({
        vc_id,
        principal: loanAmount,
        months,
      });

      if (res.success) {
        toast.success(res.message);
        setLoanAmount(0);
        setMonths(6);
      } else {
        toast.error(res.message);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create loan");
    }
  };

  if (!vc_id) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Alert severity="error">No venture ID provided</Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <CircularProgress />
      </div>
    );
  }

  if (isError || !venture) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Alert severity="error">Failed to load venture details</Alert>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <Typography
          variant="h4"
          fontWeight={700}
          className="text-gray-800 text-xl sm:text-2xl md:text-3xl"
        >
          Get Loan
        </Typography>
        <Typography
          variant="body1"
          className="text-gray-500 mt-1 text-sm sm:text-base"
        >
          Request a loan from {venture.name}
        </Typography>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Venture Info Card */}
        <Card className="shadow-lg rounded-xl bg-linear-to-br from-indigo-50 to-white">
          <CardContent className="space-y-4 p-4 sm:p-6">
            <Typography
              variant="h6"
              fontWeight={600}
              className="text-indigo-700"
            >
              {venture.name}
            </Typography>
            <Divider />

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm sm:text-base">
                  Fund Wallet
                </span>
                <span className="font-semibold text-base sm:text-lg">
                  ₹{venture.fund_wallet?.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm sm:text-base">
                  Max Loan %
                </span>
                <span className="font-semibold text-sm sm:text-base">
                  {venture.max_loan_percent}%
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm sm:text-base">
                  Interest Rate
                </span>
                <span className="font-semibold text-amber-600 text-sm sm:text-base">
                  {venture.loan_interest_percent}% p.m.
                </span>
              </div>

              <Divider />

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 sm:gap-0 bg-indigo-100 p-3 rounded-lg">
                <span className="text-indigo-700 font-medium text-sm sm:text-base">
                  Max Loan Limit
                </span>
                <span className="font-bold text-lg sm:text-xl text-indigo-700">
                  ₹{maxLoanAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loan Request Form */}
        <Card className="shadow-lg rounded-xl">
          <CardContent className="space-y-4 sm:space-y-5 p-4 sm:p-6">
            <Typography variant="h6" fontWeight={600}>
              Loan Request
            </Typography>
            <Divider />

            {/* Loan Amount Input */}
            <div>
              <Typography
                variant="body2"
                className="text-gray-600 mb-2 text-xs sm:text-sm"
              >
                Loan Amount (Max: ₹{maxLoanAmount.toLocaleString()})
              </Typography>
              <TextField
                type="number"
                fullWidth
                value={loanAmount || ""}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setLoanAmount(val > maxLoanAmount ? maxLoanAmount : val);
                }}
                placeholder="Enter loan amount"
                inputProps={{ min: 0, max: maxLoanAmount }}
              />
              <Slider
                value={loanAmount}
                onChange={(_, val) => setLoanAmount(val as number)}
                min={0}
                max={maxLoanAmount}
                step={100}
                className="mt-2"
              />
            </div>

            {/* Tenure Selection */}
            <div>
              <Typography
                variant="body2"
                className="text-gray-600 mb-2 text-xs sm:text-sm"
              >
                Loan Tenure: {months} months
              </Typography>
              <Slider
                value={months}
                onChange={(_, val) => setMonths(val as number)}
                min={1}
                max={24}
                step={1}
                marks={[
                  { value: 1, label: "1" },
                  { value: 6, label: "6" },
                  { value: 12, label: "12" },
                  { value: 24, label: "24" },
                ]}
              />
            </div>

            <Divider />

            {/* Loan Summary */}
            {loanAmount > 0 && (
              <Box className="bg-gray-50 p-4 rounded-lg space-y-2">
                <Typography variant="subtitle2" fontWeight={600}>
                  Loan Summary
                </Typography>
                <div className="flex justify-between text-sm">
                  <span>Principal Amount</span>
                  <span>₹{loanAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Interest ({interestRate}% p.m.)</span>
                  <span>₹{totalInterest.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total Repayment</span>
                  <span className="font-semibold">
                    ₹{totalRepayment.toFixed(2)}
                  </span>
                </div>
                <Divider />
                <div className="flex justify-between">
                  <span className="font-medium">Monthly EMI</span>
                  <span className="font-bold text-lg text-indigo-600">
                    ₹{monthlyEMI.toFixed(2)}
                  </span>
                </div>
              </Box>
            )}

            {/* Submit Button */}
            <button
              onClick={handleLoanRequest}
              disabled={isPending || loanAmount <= 0}
              className={`w-full py-3 sm:py-4 rounded-lg text-white font-semibold transition-all text-sm sm:text-base ${
                isPending || loanAmount <= 0
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98]"
              }`}
            >
              {isPending ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                "Request Loan"
              )}
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
