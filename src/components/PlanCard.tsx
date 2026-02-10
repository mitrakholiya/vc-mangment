"use client";

import { Card, CardContent, Divider } from "@mui/material";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import JoinRequestsPopup from "./JoinRequestsPopup";
import TakeLoanModal from "./TakeLoanModal";
import { useUpdateVentureStatus } from "@/hooks/venture/useVenture";
import { useTakeLoan } from "@/hooks/useTakeLoan";
import PlanCardHeader from "./plan-card/PlanCardHeader";
import PlanCardDetails from "./plan-card/PlanCardDetails";
import PlanCardContributions from "./plan-card/PlanCardContributions";
import PlanCardFooter from "./plan-card/PlanCardFooter";

type Plan = {
  _id: string;
  name: string;
  monthly_emi: number; // Was monthly_contribution
  interest_rate: number; // Was loan_interest_percent
  start_date: Date;
  collection_date: number; // Monthly occurrence date (1-31)
  max_loan_amount: number; // Was max_loan_percent, now fixed amount
  loan_repayment_percent: number; // Fixed Monthly Loan Repayment percentage
  members: string[]; // Array of strings (User IDs)
  requests: any[]; // Array of populated user objects

  // System fields kept for compatibility/logic
  created_at: Date;
  updated_at: Date;
  created_by: string;
  fund_wallet: number;
  status: string;
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
  // Requests Popup
  const [popup, setPopup] = useState(false);
  // Take Loan Modal
  const [loanModal, setLoanModal] = useState(false);
  // Update VC Status
  const { mutateAsync: updateVentureStatus } = useUpdateVentureStatus();
  // Add Contribution
  // const { mutateAsync: addContribution } = useAddcontribution(data._id);
  // Take Loan
  const { mutateAsync: takeLoan, isPending: isTakingLoan } = useTakeLoan();
  // Router
  const router = useRouter();

  // View page
  
  const [status, setStatus] = useState(data.status);

  const handelStatus = async () => {
    if (status === "active") {
      if (!window.confirm("Are you sure you want to inactive this venture?")) {
        return;
      }
    }

    try {
      const newStatus = status === "active" ? "inactive" : "active";
      const res = await updateVentureStatus({
        vc_id: data._id,
        status: newStatus,
      });
      if (res?.success) {
        toast.success(res?.message);
        setStatus(newStatus);
        setOpen(undefined);
      } else {
        toast.error(res?.message);
      }
    } catch (error) {
      console.error("Error updating venture status:", error);
    }
  };

  // View page
  // Monthly Contribution Handler
  // const handleAddContribution = async () => {
  //   try {
  //     const res = await addContribution();
  //     console.log(res);

  //     if (res.success) {
  //       toast.success(res.message);
  //       refetchContributions(); // Refetch contributions after adding
  //       setOpen(undefined);
  //     } else {
  //       toast.error(res.message);
  //     }
  //   } catch (error) {
  //     console.error("Error adding contribution:", error);
  //   }
  // };

  // Take Loan Handler
  const handleTakeLoan = async (amount: number) => {
    try {
      const res = await takeLoan({
        vc_id: data._id,
        loan_amount: amount,
      });

      if (res.success) {
        toast.success(res.message);
        // Optionally refetch data here
      } else {
        toast.error(res.message);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to take loan");
    }
  };

  // User Pay Emi

  return (
    <Card className="w-full shadow-lg rounded-xl">
      <CardContent className="space-y-3 p-4 sm:p-6">
        {/* Header */}
        <PlanCardHeader
          name={data.name}
          requestsCount={data.requests?.length || 0}
          isAdmin={isAdmin ?? false}
          status={status}
          maxLoanAmount={data.max_loan_amount}
          onRequestsClick={() => setPopup(true)}
          onStatusToggle={handelStatus}
        />

        <Divider />

        {/* Details */}
        <PlanCardDetails
          monthlyEmi={data.monthly_emi}
          interestRate={data.interest_rate}
          fundWallet={data.fund_wallet}
          ventureId={data._id}
        />

        <Divider />

     

        <Divider />

        {/* Take Loan Button for View Page */}
        {open !== undefined && (
          <div className="text-sm py-3">
            <button
              onClick={() => setLoanModal(true)}
              className="w-full sm:w-auto bg-secondary text-white hover:bg-secondary/90 active:scale-[0.98] px-4 py-3 sm:py-2 rounded-lg font-medium transition-all"
            >
              Take Loan
            </button>
          </div>
        )}

        <Divider />

        {/* Footer
        <PlanCardFooter
          createdAt={data.created_at}
          updatedAt={data.updated_at}
          isAdmin={isAdmin}
          showAddContribution={
            open !== undefined &&
            !contributionsData?.data?.some((c: any) => c.status === "PAID")
          }
          onAddContribution={handleAddContribution}
        /> */}

        {/* Requests Modal */}
        <JoinRequestsPopup
          open={popup}
          onClose={() => setPopup(false)}
          requests={data.requests}
          ventureId={data._id}
        />

        {/* Take Loan Modal */}
        <TakeLoanModal
          open={loanModal}
          onClose={() => setLoanModal(false)}
          vcId={data._id}
          maxLoanAmount={data.max_loan_amount}
          fundWallet={data.fund_wallet}
          interestRate={data.interest_rate}
          loanRepaymentPercent={data.loan_repayment_percent}
          onTakeLoan={handleTakeLoan}
          isLoading={isTakingLoan}
        />
      </CardContent>
    </Card>
  );
}
