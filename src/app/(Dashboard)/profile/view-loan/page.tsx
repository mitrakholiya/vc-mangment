"use client";

import {
  useGetLoansByVentureId,
  useUpdateLoanStatus,
} from "@/hooks/loan/useLoan";
import { useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  Typography,
  Chip,
  CircularProgress,
  Divider,
  Avatar,
} from "@mui/material";
import { Suspense } from "react";
import toast from "react-hot-toast";

// Loan type based on the model
interface Loan {
  _id: string;
  vc_id: string;
  user_id: string;
  principal: number;
  interest_rate: number;
  months: number;
  status: "ACTIVE" | "CLOSED";
  approve_status: "PENDING" | "APPROVED" | "REJECTED";
  created_at: string;
  closed_at?: string;
  user?: {
    name: string;
    email: string;
    phone?: string;
  };
}

interface VentureInfo {
  name: string;
  fund_wallet: number;
  loan_interest_percent: number;
  max_loan_percent: number;
}

function ViewLoanContent() {
  const searchParams = useSearchParams();
  const vc_id = searchParams.get("vc_id") || "";

  const { data, isLoading, refetch, isError, error } =
    useGetLoansByVentureId(vc_id);

  const { mutateAsync: updateLoanStatus } = useUpdateLoanStatus();

  const handleApprove = async (loanId: string, approve_status: string) => {
    // console.log("Approve", loanId,approve_status);
    const res = await updateLoanStatus({ loanId, approve_status });
    if (res.success) {
      refetch();
      toast.success(res.message);
    } else {
      refetch();

      toast.error(res.message);
    }
  };

  if (!vc_id) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <Card>
          <CardContent>
            <Typography variant="h6" color="error">
              No Venture ID provided
            </Typography>
            <Typography variant="body2" className="text-gray-500 mt-2">
              Please go back and select a venture to view loan requests.
            </Typography>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <CircularProgress />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <Card>
          <CardContent>
            <Typography variant="h6" color="error">
              Error loading loans
            </Typography>
            <Typography variant="body2" className="text-gray-500 mt-2">
              {(error as Error)?.message || "Something went wrong"}
            </Typography>
          </CardContent>
        </Card>
      </div>
    );
  }

  const loans: Loan[] = data?.data || [];
  const venture: VentureInfo = data?.venture;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "success";
      case "PENDING":
        return "warning";
      case "REJECTED":
        return "error";
      case "ACTIVE":
        return "primary";
      case "CLOSED":
        return "default";
      default:
        return "default";
    }
  };

  const calculateTotalRepayment = (
    principal: number,
    interestRate: number,
    months: number,
  ) => {
    // Interest rate is monthly, so multiply by number of months
    const totalInterest = (principal * interestRate * months) / 100;
    return principal + totalInterest;
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Venture Info Card */}
      {venture && (
        <Card className="bg-linear-to-r from-indigo-500 to-purple-600 text-white">
          <CardContent className="space-y-2">
            <Typography variant="h5" fontWeight={700}>
              {venture.name}
            </Typography>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div>
                <Typography variant="caption" className="opacity-80">
                  Fund Wallet
                </Typography>
                <Typography variant="h6">₹{venture.fund_wallet}</Typography>
              </div>
              <div>
                <Typography variant="caption" className="opacity-80">
                  Interest Rate (Monthly)
                </Typography>
                <Typography variant="h6">
                  {venture.loan_interest_percent}%
                </Typography>
              </div>
              <div>
                <Typography variant="caption" className="opacity-80">
                  Max Loan %
                </Typography>
                <Typography variant="h6">
                  {venture.max_loan_percent}%
                </Typography>
              </div>
              <div>
                <Typography variant="caption" className="opacity-80">
                  Total Requests
                </Typography>
                <Typography variant="h6">{loans.length}</Typography>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Page Title */}
      <Typography variant="h5" fontWeight={600}>
        Loan Requests
      </Typography>

      {/* Loans List */}
      {loans.length === 0 ? (
        <Card>
          <CardContent className="text-center py-10">
            <Typography variant="h6" className="text-gray-500">
              No loan requests yet
            </Typography>
            <Typography variant="body2" className="text-gray-400 mt-2">
              Loan requests from venture members will appear here
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {loans.map((loan) => (
            <Card
              key={loan._id}
              className="shadow-md hover:shadow-lg transition-shadow"
            >
              <CardContent className="space-y-4">
                {/* User Info & Status */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="bg-indigo-600">
                      {loan.user?.name?.charAt(0) || "U"}
                    </Avatar>
                    <div>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {loan.user?.name || "Unknown User"}
                      </Typography>
                      <Typography variant="body2" className="text-gray-500">
                        {loan.user?.email || "No email"}
                      </Typography>
                      {loan.user?.phone && (
                        <Typography variant="body2" className="text-gray-500">
                          Phone: {loan.user.phone}
                        </Typography>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Chip
                      label={loan.approve_status}
                      color={getStatusColor(loan.approve_status)}
                      size="small"
                    />
                    <Chip
                      label={loan.status}
                      color={getStatusColor(loan.status)}
                      size="small"
                      variant="outlined"
                    />
                  </div>
                </div>

                <Divider />

                {/* Loan Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <Typography variant="caption" className="text-gray-500">
                      Principal Amount
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      ₹{loan.principal}
                    </Typography>
                  </div>
                  <div>
                    <Typography variant="caption" className="text-gray-500">
                      Interest Rate (Monthly)
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {loan.interest_rate}%
                    </Typography>
                  </div>
                  <div>
                    <Typography variant="caption" className="text-gray-500">
                      Duration
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {loan.months} months
                    </Typography>
                  </div>
                  <div>
                    <Typography variant="caption" className="text-gray-500">
                      Total Repayment
                    </Typography>
                    <Typography
                      variant="body1"
                      fontWeight={600}
                      className="text-green-600"
                    >
                      ₹
                      {calculateTotalRepayment(
                        loan.principal,
                        loan.interest_rate,
                        loan.months,
                      )}
                    </Typography>
                  </div>
                </div>

                <Divider />

                {/* Timestamps & Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="text-xs text-gray-500">
                    <p>
                      <strong>Requested:</strong>{" "}
                      {new Date(loan.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    {loan.closed_at && (
                      <p>
                        <strong>Closed:</strong>{" "}
                        {new Date(loan.closed_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    )}
                  </div>

                  {/* Action buttons for pending loans */}
                  {loan.approve_status === "PENDING" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(loan._id, "APPROVED")}
                        className="bg-green-600 text-white hover:bg-green-700 active:scale-[0.98] px-4 py-2 rounded-lg font-medium transition-all text-sm"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleApprove(loan._id, "REJECTED")}
                        className="bg-red-600 text-white hover:bg-red-700 active:scale-[0.98] px-4 py-2 rounded-lg font-medium transition-all text-sm"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Wrap with Suspense for useSearchParams
export default function ViewLoanPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-[300px]">
          <CircularProgress />
        </div>
      }
    >
      <ViewLoanContent />
    </Suspense>
  );
}
