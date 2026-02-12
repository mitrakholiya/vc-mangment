"use client";
import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getVentureById } from "@/hooks/venture/useVenture";
import api from "@/lib/axios";
import {
  CircularProgress,
  Typography,
  Alert,
  Card,
  CardContent,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";

const LeaveVCPage = () => {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [calculationData, setCalculationData] = useState<any | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loadingCalculation, setLoadingCalculation] = useState(false);

  // Fetch Venture Data
  const {
    data: venture,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["venture", id],
    queryFn: () => getVentureById(id),
    enabled: !!id,
  });

  // Exit Mutation
  const exitMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await api.post("/venture/exit-member", {
        vc_id: id,
        user_id: userId,
      });
      return res.data;
    },
    onSuccess: (data) => {
      alert(
        `Success: ${data.message}\n` +
          `Payable Amount: ₹${data.data?.payableAmount}\n` +
          `Status: ${data.data?.status || "Processed"}`,
      );
      setIsDialogOpen(false);
      setSelectedUser(null);
      setCalculationData(null);
      window.location.reload();
    },
    onError: (err: any) => {
      alert(`Error: ${err.response?.data?.message || err.message}`);
    },
  });

  const handleMemberClick = async (member: any) => {
    setSelectedUser(member.user_id);
    setLoadingCalculation(true);
    setIsDialogOpen(true);
    setCalculationData(null);

    try {
      // Fetch calculation preview
      const res = await api.get("/venture/exit-member", {
        params: { vc_id: id, user_id: member.user_id._id },
      });
      if (res.data.success) {
        setCalculationData(res.data.data);
      } else {
        alert("Failed to fetch calculation details.");
        setIsDialogOpen(false);
      }
    } catch (error) {
      console.error(error);
      alert("Error fetching calculation details.");
      setIsDialogOpen(false);
    } finally {
      setLoadingCalculation(false);
    }
  };

  const handleConfirmExit = () => {
    if (selectedUser) {
      exitMutation.mutate(selectedUser._id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <CircularProgress />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4">
        <Alert severity="error">
          Error loading venture: {(error as Error).message}
        </Alert>
      </div>
    );
  }

  if (!venture) {
    return <div className="p-4">Venture not found</div>;
  }

  const members = venture.members || [];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <Typography variant="h5" className="font-bold text-gray-800">
          Leave VC - Select Member
        </Typography>
        <Button variant="text" onClick={() => router.back()}>
          Back
        </Button>
      </div>

      <Typography variant="body2" className="mb-4 text-gray-500">
        Click on a member card to view their exit calculation. You can confirm
        the exit after review.
      </Typography>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map((member: any) => {
          const user = member.user_id;
          if (!user) return null;

          return (
            <Card
              key={user._id}
              className="cursor-pointer hover:shadow-lg transition-shadow border border-gray-100"
              onClick={() => handleMemberClick(member)}
            >
              <CardContent className="flex items-center gap-4">
                <Avatar className="bg-blue-600 text-white font-bold">
                  {user.name?.charAt(0).toUpperCase()}
                </Avatar>
                <div>
                  <Typography className="font-bold text-gray-800">
                    {user.name}
                  </Typography>
                  <Typography variant="caption" className="text-gray-500 block">
                    {user.email}
                  </Typography>
                  <Typography variant="caption" className="text-gray-500 block">
                    {member.role}
                  </Typography>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Calculation Dialog */}
      <Dialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle className="font-bold">
          Exit Calculation: {selectedUser?.name}
        </DialogTitle>
        <DialogContent dividers>
          {loadingCalculation ? (
            <div className="flex justify-center py-8">
              <CircularProgress />
            </div>
          ) : calculationData ? (
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">
                  Total Contribution (Hapto):
                </span>
                <span className="font-bold">
                  ₹{calculationData.totalContribution.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Share of Interest (Vyaj):</span>
                <span className="font-bold text-green-600">
                  + ₹{calculationData.totalInterestShare.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Remaining Loan (Debt):</span>
                <span className="font-bold text-red-600">
                  - ₹{calculationData.currentRemainingLoan.toLocaleString()}
                </span>
              </div>
              <div className="border-t pt-2 mt-2 flex justify-between">
                <span className="font-bold text-lg">Net Payable Amount:</span>
                <span
                  className={`font-bold text-lg ${calculationData.payableAmount >= 0 ? "text-green-700" : "text-red-700"}`}
                >
                  ₹{calculationData.payableAmount.toLocaleString()}
                </span>
              </div>

              {/* Fund Check Warning */}
              {!calculationData.canPayImmediately &&
                calculationData.payableAmount > 0 && (
                  <Alert severity="warning" className="mt-4">
                    <strong>Insufficient Funds!</strong> Current Venture Wallet
                    Balance: ₹{calculationData.walletBalance?.toLocaleString()}.
                    This exit will be marked as <strong>PENDING</strong>.
                  </Alert>
                )}
              {calculationData.canPayImmediately &&
                calculationData.payableAmount > 0 && (
                  <Alert severity="success" className="mt-4">
                    Funds Available. Exit can be processed immediately.
                  </Alert>
                )}
            </div>
          ) : (
            <Typography color="error">Failed to load data.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleConfirmExit}
            variant="contained"
            color="error"
            disabled={loadingCalculation || !calculationData}
          >
            Exit Member
          </Button>
        </DialogActions>
      </Dialog>

      {/* Global Processing Loader */}
      {exitMutation.isPending && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-1400">
          <div className="bg-white p-4 rounded-lg flex items-center gap-2 shadow-lg">
            <CircularProgress size={20} />
            <span>Processing Exit...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveVCPage;
