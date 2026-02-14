import React, { useEffect } from "react";
import Link from "next/link";

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Typography,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Box,
  Alert,
  IconButton,
  Fab,
} from "@mui/material";
import toast from "react-hot-toast";
import {
  useGetVcMonthly,
  usePutLock,
  usePutRedoApprove,
} from "@/hooks/contribution/useContribution";
import NextMonthData from "./NextMonthData";
import { Share2, Download } from "lucide-react";
import { shareMonthlyPdf } from "@/lib/shareMonthlyData";
import Loading from "../Loading";
import {
  useGetExitingDues,
  useRepayExitingDues,
} from "@/hooks/venture/useVenture";

interface VcUserMonthly {
  _id: string;
  user_id: {
    _id: string;
    name: string;
    email: string;
  };
  monthly_contribution: number;
  loan_amount: number;
  loan_monthly_emi: number;
  loan_interest: number;
  part_payment: number;
  remaining_loan: number;
  last_month_remaining_loan: number;
  total_payable: number;
  month: number;
  year: number;
  status: string;
}

interface MemberTableUIProps {
  userVcMonthlyData: VcUserMonthly[];
  isLoading: boolean;
  isError: boolean;
  error: any;
  refetch: () => void;
  onApprove: (id: string, partPayment: number) => Promise<any>;
  onAddLoan: (loan: any) => Promise<any>;
  monthName: string;
  year: number;
  vcMonthlyData?: any[];
  vcId: string;
}

const MemberTableUI: React.FC<MemberTableUIProps> = ({
  userVcMonthlyData,
  isLoading,
  isError,
  error,
  refetch,
  onApprove,
  onAddLoan,
  monthName,
  year,
  vcMonthlyData = [],
  vcId,
}) => {
  const [loading, setLoading] = React.useState(false);

  const { data: exitingDues } = useGetExitingDues(vcId);

  const { mutateAsync: redoApprovel } = usePutRedoApprove();
  const { mutateAsync: repayDues } = useRepayExitingDues();

  const handelRedoApprovel = async (id: string) => {
    setLoading(true);
    const res = await redoApprovel(id);
    if (res?.success === true) {
      toast.success(res?.message);
      refetch();
    } else {
      toast.error(res?.message || "Something Went Wrong");
      refetch();
    }
    setLoading(false);
  };

  // Calculate matching VcMonthly record for current view
  const currentMonthNum = userVcMonthlyData?.[0]?.month;
  const currentYearNum = userVcMonthlyData?.[0]?.year;

  const currentVcMonthly = React.useMemo(() => {
    if (!vcMonthlyData || !currentMonthNum || !currentYearNum) return null;
    return vcMonthlyData.find(
      (m: any) => m.month == currentMonthNum && m.year == currentYearNum,
    );
  }, [vcMonthlyData, currentMonthNum, currentYearNum]);

  const last_month_remaining_amount =
    currentVcMonthly?.last_month_remaining_amount || 0;

  // Robust calculation of remaining amount based on current data
  const { totalMonthlyCont, totalLoanRepay, totalLoanVyaj, totalPartPay } =
    React.useMemo(() => {
      return {
        totalMonthlyCont: userVcMonthlyData.reduce(
          (s, r) => s + (r.monthly_contribution || 0),
          0,
        ),
        totalLoanRepay: userVcMonthlyData.reduce(
          (s, r) => s + (r.loan_monthly_emi || 0),
          0,
        ),
        totalLoanVyaj: userVcMonthlyData.reduce(
          (s, r) => s + (r.loan_interest || 0),
          0,
        ),
        totalPartPay: userVcMonthlyData.reduce(
          (s, r) => s + (r.part_payment || 0),
          0,
        ),
      };
    }, [userVcMonthlyData]);

  const currentTotalFunds =
    last_month_remaining_amount +
    totalMonthlyCont +
    totalLoanRepay +
    totalLoanVyaj +
    totalPartPay;

  const totalLoansGiven =
    currentVcMonthly?.loans?.reduce(
      (s: any, l: any) => s + (l.loan_amount || 0),
      0,
    ) || 0;
  const totalExitingPaid =
    currentVcMonthly?.exiting_members?.reduce(
      (s: any, m: any) => s + (m.total_paid || 0),
      0,
    ) || 0;

  const RemainingAmount =
    currentTotalFunds - totalLoansGiven - totalExitingPaid;

  const withOuntLastMonthRema = currentTotalFunds - last_month_remaining_amount;

  // Local State for Dialogs
  const [done, setDone] = React.useState(vcMonthlyData?.[0]?.lock || false);

  React.useEffect(() => {
    if (vcMonthlyData && vcMonthlyData.length > 0) {
      setDone(vcMonthlyData[0]?.lock || false);
    }
  }, [vcMonthlyData]);

  const [isLoanModalOpen, setIsLoanModalOpen] = React.useState(false);
  const [selectedUserForLoan, setSelectedUserForLoan] = React.useState<
    any | null
  >(null);
  const [loanAmountInput, setLoanAmountInput] = React.useState("");
  const [isApproveDialogOpen, setIsApproveDialogOpen] = React.useState(false);
  const [approveSelectedId, setApproveSelectedId] = React.useState<
    string | null
  >(null);
  const [partPaymentInput, setPartPaymentInput] = React.useState("");

  const [isRepayDialogOpen, setIsRepayDialogOpen] = React.useState(false);
  const [selectedExitingMember, setSelectedExitingMember] = React.useState<
    any | null
  >(null);
  const [repayAmountInput, setRepayAmountInput] = React.useState("");

  const { mutateAsync: onLock } = usePutLock();

  // Loan dialog
  const handleOpenLoanDialog = () => {
    setIsLoanModalOpen(true);
    setSelectedUserForLoan(null);
    setLoanAmountInput("");
  };

  const handleCloseLoanDialog = () => {
    setIsLoanModalOpen(false);
    setSelectedUserForLoan(null);
    setLoanAmountInput("");
  };

  // Repayment dialog

  const handleOpenRepayDialog = (id: string, amount: number) => {
    const member = exitingDues?.find((m: any) => m._id === id);
    setSelectedExitingMember(member);
    setRepayAmountInput(amount.toString());
    setIsRepayDialogOpen(true);
  };

  const handleCloseRepayDialog = () => {
    setIsRepayDialogOpen(false);
    setSelectedExitingMember(null);
    setRepayAmountInput("");
  };

  const handleConfirmRepay = async () => {
    if (!selectedExitingMember) return;
    setLoading(true);
    const amountVal = Number(repayAmountInput);
    if (amountVal > RemainingAmount) {
      toast.error(
        `Insufficient venture funds. Max available: ₹${RemainingAmount.toLocaleString()}`,
      );
      setLoading(false);
      return;
    }

    try {
      const res = await repayDues({
        vc_id: vcId,
        user_id: selectedExitingMember.user_id._id,
        paidAmount: amountVal,
      });

      if (res.success) {
        toast.success(res.message || "Repayment recorded successfully");
        handleCloseRepayDialog();
        refetch();
      } else {
        toast.error(res.message || "Failed to record repayment");
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUserForLoan = (user: any) => {
    setSelectedUserForLoan(user);
    setLoanAmountInput("");
  };

  const handleSubmitSingleLoan = async () => {
    if (!selectedUserForLoan || !loanAmountInput) return;

    const amountVal = Number(loanAmountInput);
    if (amountVal > RemainingAmount) {
      toast.error(
        `Insufficient funds. Max available: ₹${RemainingAmount.toLocaleString()}`,
      );
      return;
    }
    setLoading(true);

    const manualLoanMap = { [selectedUserForLoan._id]: loanAmountInput };
    const res = await onAddLoan({ loan: manualLoanMap });
    if (res?.success === true) {
      toast.success(res?.message);
      refetch();
      handleCloseLoanDialog();
    } else {
      toast.error(res?.message || "Something Went Wrong");
      refetch();
    }
    setLoading(false);
  };

  let compalated = userVcMonthlyData?.every(
    (row: any) => row.status === "approved",
  );
  if (done) compalated = false;

  // Calculate selected user for approval dialog
  // Moved up to avoid hook order issues with early returns
  const selectedApproveUser = React.useMemo(
    () =>
      userVcMonthlyData
        ? userVcMonthlyData.find((u) => u._id === approveSelectedId)
        : null,
    [userVcMonthlyData, approveSelectedId],
  );

  const maxPartPayment = selectedApproveUser?.remaining_loan || 0;
  const isPartPaymentInvalid =
    !!partPaymentInput && Number(partPaymentInput) > maxPartPayment;

  if (isLoading) return <Loading />;
  if (isError)
    return (
      <div className="text-center text-gray-700 font-bold py-4">
        Error: {(error as Error).message}
      </div>
    );
  if (userVcMonthlyData.length === 0)
    return (
      <Typography variant="body1" className="text-center py-4">
        No contribution data found.
      </Typography>
    );

  const totalMonthlyContribution = userVcMonthlyData.reduce(
    (sum, row) => sum + (row.monthly_contribution || 0),
    0,
  );
  const totalLoanAmount = userVcMonthlyData.reduce(
    (sum, row) => sum + (row.loan_amount || 0),
    0,
  );
  const totalRemainingLoan = userVcMonthlyData.reduce(
    (sum, row) => sum + (row.remaining_loan || 0),
    0,
  );
  const totalLastPendingLoan = userVcMonthlyData.reduce(
    (sum, row) => sum + (row.last_month_remaining_loan || 0),
    0,
  );
  const totalLoanEmi = userVcMonthlyData.reduce(
    (sum, row) => sum + (row.loan_monthly_emi || 0),
    0,
  );
  const totalLoanInterest = userVcMonthlyData.reduce(
    (sum, row) => sum + (row.loan_interest || 0),
    0,
  );
  const totalPartPayment = userVcMonthlyData.reduce(
    (sum, row) => sum + (row.part_payment || 0),
    0,
  );
  const totalPayable = userVcMonthlyData.reduce(
    (sum, row) => sum + (row.total_payable || 0),
    0,
  );

  // Approve Dialog State

  const handleOpenApproveDialog = async (id: string, hasLoan: boolean) => {
    // If user has no loan at all, we can approve directly.
    // But if they have a loan (either new or existing), we should show the box.
    setLoading(true);
    if (!hasLoan) {
      const res = await onApprove(id, 0);

      if (res?.success === true) {
        toast.success("Approved successfully");
        refetch();
      } else {
        toast.error(res?.message || "Something Went Wrong");
      }
    } else {
      setApproveSelectedId(id);
      setPartPaymentInput("");
      setIsApproveDialogOpen(true);
    }
    setLoading(false);
  };

  const handleCloseApproveDialog = () => {
    setIsApproveDialogOpen(false);
    setApproveSelectedId(null);
    setPartPaymentInput("");
  };

  const handleConfirmApprove = async () => {
    if (!approveSelectedId) return;
    const partPayment = partPaymentInput ? Number(partPaymentInput) : 0;

    // Validation: Part payment cannot exceed remaining loan
    const selectedRecord = userVcMonthlyData.find(
      (u) => u._id === approveSelectedId,
    );

    if (selectedRecord) {
      const remainingLoan = selectedRecord.remaining_loan || 0;
      if (partPayment > remainingLoan) {
        toast.error(
          `Part payment (₹${partPayment}) cannot exceed remaining loan (₹${remainingLoan})`,
        );
        return;
      }
    }

    // Call mutation with object
    setLoading(true);
    const res = await onApprove(approveSelectedId, partPayment);

    if (res?.success === true) {
      toast.success("Approved successfully");
      refetch();
      handleCloseApproveDialog();
    } else {
      toast.error(res?.message || "Something Went Wrong");
      handleCloseApproveDialog();
    }
    setLoading(false);
  };

  // Direct approvel

  const handleDirectApprovel = async (id: string) => {
    setLoading(true);
    // Call mutation with object
    const res = await onApprove(id, 0);

    if (res?.success === true) {
      toast.success("Approved successfully");
      refetch();
    } else {
      toast.error(res?.message || "Something Went Wrong");
    }
    setLoading(false);
  };

  // Handel Lock this month

  const handleLock = async () => {
    if (!vcMonthlyData[0]?._id) return;

    const confirmed = window.confirm(
      "Are you sure you want to finalize this month? This action cannot be undone.",
    );
    if (!confirmed) return;
    setLoading(true);

    const res = await onLock(vcMonthlyData[0]?._id);
    if (res?.success === true) {
      toast.success("Locked successfully");
      refetch();
    } else {
      toast.error(res?.message || "Something Went Wrong");
    }
    setLoading(false);
  };

  // Calculate totals at component level to pass to share function (duplication of logic inside render, cleaner to lift up)
  const currentMonthMatch = vcMonthlyData.find(
    (m: any) => m.month == currentMonthNum && m.year == currentYearNum,
  );
  const totalLoansGlobal =
    currentMonthMatch?.loans?.reduce(
      (sum: any, loan: any) => sum + loan.loan_amount,
      0,
    ) || 0;

  const totalExitingGlobal =
    currentMonthMatch?.exiting_members?.reduce(
      (sum: any, member: any) => sum + member.total_paid,
      0,
    ) || 0;

  const handleShare = async (action: "share" | "download" = "share") => {
    // Prepare Data
    const summaryData = {
      totalCollection: withOuntLastMonthRema,
      totalLoans: totalLoansGlobal, // Need to ensure these are accessible or recalculated
      totalExiting: totalExitingGlobal,
      remainingBalance:
        last_month_remaining_amount +
        withOuntLastMonthRema -
        totalLoansGlobal -
        totalExitingGlobal,
      lastMonthBalance: last_month_remaining_amount,
    };

    const newLoansDetails =
      currentMonthMatch?.loans?.map((loan: any) => {
        const user = userVcMonthlyData.find(
          (u) => String(u.user_id?._id) === String(loan.user_id),
        );
        return {
          name: user?.user_id?.name || "Unknown Member",
          loan_amount: loan.loan_amount,
        };
      }) || [];

    await shareMonthlyPdf(
      userVcMonthlyData,
      monthName,
      year,
      "SyncEra Solution",
      summaryData,
      newLoansDetails,
      action,
    );
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="mt-4">
      <div className="flex justify-between items-center px-2 mb-2 border-b border-gray-100 pb-2 ">
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
          <h4 className="text-xl font-secondary! font-bold text-secondary tracking-widest uppercase">
            Member Table
          </h4>
          {/* <div className="flex items-center gap-1.5 bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
            <span className="text-[10px] font-bold text-primary uppercase tracking-tight">
              Venture Balance:
            </span>
            <span className="text-sm font-extrabold text-primary">
              ₹{RemainingAmount.toLocaleString()}
            </span>
          </div> */}
        </div>
        {/* <div className="h-px bg-primary flex-1 mx-3"></div> */}

        <div className="flex items-center gap-3">
          {/* <Typography className="text-sm font-extrabold text-gray-500 uppercase tracking-tighter">
            {monthName} {year}
          </Typography> */}
          <div className="flex gap-2 border-l pl-3 border-gray-200">
            <IconButton
              onClick={() => handleShare("download")}
              size="small"
              className="bg-gray-100 hover:bg-gray-200 text-gray-600"
              title="Download PDF"
            >
              <Download className="w-4 h-4" />
            </IconButton>
            <IconButton
              onClick={() => handleShare("share")}
              size="small"
              className="bg-gray-100 hover:bg-gray-200 text-gray-600"
              title="Share PDF"
            >
              <Share2 className="w-4 h-4" />
            </IconButton>
          </div>
        </div>
      </div>
      <TableContainer
        // ...
        component={Paper}
        className="shadow-md rounded-lg text-[8px] my-[10px] "
        // sx={{ overflow: "hidden" }}
      >
        <Table
          sx={{
            minWidth: 280,
            "& .Mui TableCell-root": {
              padding: "2px 4px",
              fontSize: "10px",
            },
          }}
          size="small"
          aria-label="member table"
        >
          <TableHead className="bg-primary">
            <TableRow>
              <TableCell
                sx={{
                  color: "white",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  fontSize: "11px",
                }}
              >
                No.
              </TableCell>
              <TableCell
                sx={{
                  color: "white",
                  fontWeight: "bold",
                  position: "sticky",
                  left: 0,
                  textTransform: "uppercase",
                  fontSize: "11px",
                  backgroundColor: "#04594A",
                }}
              >
                Name
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  color: "white",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  fontSize: "11px",
                }}
              >
                Monthly hapto
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  color: "white",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  fontSize: "11px",
                }}
              >
                Total Loan
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  color: "white",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  fontSize: "11px",
                }}
              >
                Last Pending Loan
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  color: "white",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  fontSize: "11px",
                }}
              >
                Loan Hapto
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  color: "white",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  fontSize: "11px",
                }}
              >
                Loan Vyaj
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  color: "white",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  fontSize: "11px",
                }}
              >
                Part Payment
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  color: "white",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  fontSize: "11px",
                }}
              >
                Remaining Loan
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  color: "white",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  fontSize: "11px",
                }}
              >
                Total Payable
              </TableCell>
              {!done && (
                <TableCell
                  align="center"
                  sx={{
                    color: "white",
                    fontWeight: "bold",
                    textTransform: "uppercase",
                    fontSize: "11px",
                  }}
                >
                  Action
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {userVcMonthlyData.map((row, index) => (
              <TableRow
                key={row._id}
                sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                className="hover:bg-gray-50 transition-colors"
              >
                <TableCell component="th" scope="row" className="text-gray-500">
                  {index + 1}
                </TableCell>
                <TableCell
                  className="text-primary font-bold"
                  sx={{
                    maxWidth: "150px",
                    minWidth: "100px",
                    lineHeight: "1.2",
                    position: "sticky",
                    left: 0,
                    backgroundColor: "#f9fafb",
                  }}
                >
                  {row.user_id?.name || "Unknown"}
                </TableCell>
                <TableCell align="right" className="text-gray-700">
                  ₹{row.monthly_contribution.toLocaleString()}
                </TableCell>
                <TableCell align="right" className="text-gray-400">
                  {row.loan_amount > 0
                    ? `₹${row.loan_amount.toLocaleString()}`
                    : "—"}
                </TableCell>
                <TableCell
                  align="right"
                  className="text-secondary! font-semibold"
                >
                  {row.last_month_remaining_loan > 0
                    ? `₹${row.last_month_remaining_loan.toLocaleString()}`
                    : "—"}
                </TableCell>
                <TableCell
                  align="right"
                  className="text-gray-700 font-semibold"
                >
                  {row.loan_monthly_emi > 0
                    ? `₹${row.loan_monthly_emi.toLocaleString()}`
                    : "—"}
                </TableCell>
                <TableCell
                  align="right"
                  className="text-gray-700 font-semibold"
                >
                  {row.loan_interest > 0
                    ? `₹${row.loan_interest.toLocaleString()}`
                    : "—"}
                </TableCell>
                <TableCell align="right" className="text-gray-400">
                  {row.part_payment > 0
                    ? `₹${row.part_payment.toLocaleString()}`
                    : "—"}
                </TableCell>
                <TableCell
                  align="right"
                  className={
                    row.remaining_loan > 0
                      ? "text-red-500! font-bold"
                      : "text-gray-400"
                  }
                >
                  {row.remaining_loan > 0
                    ? `₹${row.remaining_loan.toLocaleString()}`
                    : "—"}
                </TableCell>
                <TableCell align="right" className="text-primary font-bold">
                  ₹{row.total_payable.toLocaleString()}
                </TableCell>

                {/* IN vc monthly lock = false than show */}
                {!done && (
                  <TableCell align="center">
                    <div className="flex items-center justify-center gap-2">
                      {row.status !== "approved" && (
                        <>
                          <div
                            className="w-8 h-8 rounded-full text-secondary/80 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform "
                            title="Direct Approve"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDirectApprovel(row._id);
                            }}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className="w-8 h-8"
                            >
                              <path
                                fillRule="evenodd"
                                d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>

                          {row.remaining_loan > 0 && (
                            <div
                              className="w-8 h-8 rounded-full text-primary flex items-center justify-center cursor-pointer hover:scale-110 transition-transform "
                              title="Approve with Part Payment"
                              onClick={() =>
                                handleOpenApproveDialog(
                                  row._id,
                                  row.remaining_loan > 0 || row.loan_amount > 0,
                                )
                              }
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                                className="w-5 h-5"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M12 4.5v15m7.5-7.5h-15"
                                />
                              </svg>
                            </div>
                          )}
                        </>
                      )}
                      {row.status === "approved" && (
                        <>
                          <div className="w-8 h-8 rounded-full text-primary flex items-center justify-center cursor-pointer hover:scale-110 transition-transform ">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className="w-8 h-8"
                            >
                              <path
                                fillRule="evenodd"
                                d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>

                          <div
                            onClick={() => handelRedoApprovel(row._id)}
                            className="w-8 h-8 rounded-full text-primary flex items-center justify-center cursor-pointer hover:scale-110 transition-transform "
                            title="Undo/Refresh"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={2}
                              stroke="currentColor"
                              className="w-4 h-4"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                              />
                            </svg>
                          </div>
                        </>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {/* Total Row */}

            <TableRow className="bg-primary/20 border-t border-b border-1 border-primary">
              <TableCell></TableCell>

              <TableCell
                align="center"
                className="text-primary font-bold text-lg "
                sx={{
                  position: "sticky",
                  left: 0,
                  backgroundColor: "#04594A",
                  color: "white",
                }}
              >
                Total
              </TableCell>
              <TableCell align="right" className="text-primary font-bold">
                ₹{totalMonthlyContribution.toLocaleString()}
              </TableCell>
              <TableCell align="right" className="text-gray-400">
                {totalLoanAmount > 0
                  ? `₹${totalLoanAmount.toLocaleString()}`
                  : "—"}
              </TableCell>
              <TableCell align="right" className="text-primary font-bold">
                {totalLastPendingLoan > 0
                  ? `₹${totalLastPendingLoan.toLocaleString()}`
                  : "—"}
              </TableCell>
              <TableCell align="right" className="text-primary font-bold">
                {totalLoanEmi > 0 ? `₹${totalLoanEmi.toLocaleString()}` : "—"}
              </TableCell>
              <TableCell align="right" className="text-primary font-bold">
                {totalLoanInterest > 0
                  ? `₹${totalLoanInterest.toLocaleString()}`
                  : "—"}
              </TableCell>
              <TableCell align="right" className="text-primary font-bold">
                {totalPartPayment > 0
                  ? `₹${totalPartPayment.toLocaleString()}`
                  : "—"}
              </TableCell>
              <TableCell align="right" className="text-primary font-bold">
                {totalRemainingLoan > 0
                  ? `₹${totalRemainingLoan.toLocaleString()}`
                  : "—"}
              </TableCell>
              <TableCell
                align="right"
                className="text-primary font-bold text-lg"
              >
                ₹{totalPayable.toLocaleString()}
              </TableCell>
              {!done && <TableCell></TableCell>}
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      {/* Approve Dialog */}
      <Dialog
        open={isApproveDialogOpen}
        onClose={handleCloseApproveDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle className="text-sm font-bold">
          Approve Contribution
        </DialogTitle>
        <DialogContent>
          <div className="pt-2">
            <Typography variant="caption" className="mb-2 block text-gray-600">
              Starts with part payment. Max available:{" "}
              <strong>₹{maxPartPayment.toLocaleString()}</strong>
            </Typography>
            <TextField
              autoFocus
              label="Part Payment (Optional)"
              type="number"
              fullWidth
              variant="outlined"
              size="small"
              value={partPaymentInput}
              onChange={(e) => setPartPaymentInput(e.target.value)}
              placeholder={`Max ${maxPartPayment}`}
              error={isPartPaymentInvalid}
              helperText={
                isPartPaymentInvalid
                  ? `Cannot exceed remaining loan (₹${maxPartPayment})`
                  : "This amount will be deducted from remaining loan"
              }
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseApproveDialog}
            size="small"
            color="inherit"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmApprove}
            variant="contained"
            size="small"
            color="primary"
          >
            Confirm Approve
          </Button>
        </DialogActions>
      </Dialog>

      {/* Repay Dialog */}
      <Dialog
        open={isRepayDialogOpen}
        onClose={handleCloseRepayDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle className="text-sm font-bold">
          Record Repayment
        </DialogTitle>
        <DialogContent dividers>
          <div className="pt-2 space-y-4">
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <Typography
                variant="caption"
                className="text-gray-500 uppercase font-bold tracking-wider"
              >
                Member
              </Typography>
              <Typography className="font-bold text-gray-800">
                {selectedExitingMember?.user_id?.name || "Unknown"}
              </Typography>
            </div>

            <TextField
              label="Repayment Amount"
              type="number"
              fullWidth
              variant="outlined"
              size="small"
              value={repayAmountInput}
              onChange={(e) => setRepayAmountInput(e.target.value)}
              InputProps={{
                startAdornment: <span className="mr-1 text-gray-400">₹</span>,
              }}
              error={
                Number(repayAmountInput) <= 0 ||
                Number(repayAmountInput) >
                  (selectedExitingMember?.unpaid_amount || 0) ||
                Number(repayAmountInput) > RemainingAmount
              }
              helperText={
                Number(repayAmountInput) > RemainingAmount
                  ? `Insufficient venture funds. Available: ₹${RemainingAmount.toLocaleString()}`
                  : `Total dues: ₹${selectedExitingMember?.unpaid_amount?.toLocaleString() || 0}`
              }
            />
          </div>
        </DialogContent>
        <DialogActions className="bg-gray-50">
          <Button onClick={handleCloseRepayDialog} size="small" color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleConfirmRepay}
            variant="contained"
            size="small"
            color="primary"
            disabled={
              !repayAmountInput ||
              Number(repayAmountInput) <= 0 ||
              Number(repayAmountInput) >
                (selectedExitingMember?.unpaid_amount || 0) ||
              Number(repayAmountInput) > RemainingAmount
            }
          >
            Confirm Repayment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Loan Dialog */}
      <Dialog
        open={isLoanModalOpen}
        onClose={handleCloseLoanDialog}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle className="text-xl! font-bold">
          {selectedUserForLoan
            ? `${selectedUserForLoan.user_id?.name}`
            : "Select User for Loan"}
        </DialogTitle>
        <DialogContent dividers className="px-2!">
          {!selectedUserForLoan ? (
            <div className="max-h-[500px] space-y-2  custom-scrollbar py-1">
              {userVcMonthlyData.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No members available
                </div>
              ) : (
                userVcMonthlyData.map((user) => (
                  <div
                    key={user._id}
                    onClick={() => handleSelectUserForLoan(user)}
                    className="group flex justify-between items-center p-2 sm:p-3 rounded-xl border border-gray-100 hover:border-blue-300 hover:bg-blue-50/50 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-linear-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-600 font-bold text-sm shadow-inner group-hover:from-blue-100 group-hover:to-blue-200 group-hover:text-blue-700 transition-colors">
                        {user.user_id?.name
                          ? user.user_id.name.charAt(0).toUpperCase()
                          : "?"}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-gray-800 group-hover:text-blue-900 leading-tight">
                          {user.user_id?.name || "Unknown"}
                        </span>
                        <div className="flex items-center text-xs text-gray-500 mt-0.5">
                          <span className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
                            Current Loan
                          </span>
                          <span
                            className={
                              (user.remaining_loan || 0) > 0
                                ? "text-primary font-bold"
                                : "text-green-600 font-bold"
                            }
                          >
                            ₹{user.remaining_loan?.toLocaleString() || 0}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className=" hidden  w-8 h-8 rounded-full bg-white border border-gray-200 sm:flex items-center justify-center group-hover:border-blue-500 group-hover:bg-blue-600 transition-all transform group-hover:scale-105 shadow-sm">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                        stroke="currentColor"
                        className="w-4 h-4 text-gray-300 group-hover:text-white transition-colors"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8.25 4.5l7.5 7.5-7.5 7.5"
                        />
                      </svg>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            // next box in new loan

            <div className="space-y-5 pt-2">
              {/* Fund Availability Card */}
              <div className=" p-2 rounded-xl border border-gray-100 shadow-sm space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 bg-blue-100 rounded-lg">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-4 h-4 text-gray-700"
                    >
                      <path d="M10.464 8.746c.227-.18.497-.311.786-.394v2.795a2.252 2.252 0 01-.786-.393c-.394-.313-.546-.681-.546-1.004 0-.315.148-.656.546-1.004zM12.75 15.662v-2.824c.347.085.664.228.948.442.336.26.54.671.554 1.14h-1.502zM12.75 8.352c.866.115 1.545.69 1.708 1.488h-1.708V8.352zM10.75 12.838v2.803c-.866-.115-1.545-.69-1.708-1.488h1.708zM9 12.019V10.3c0-.853.641-1.597 1.488-1.708v-1.13h2.024v1.13c.847.11 1.488.854 1.488 1.708v1.719a6.723 6.723 0 01-1.026 3.518l1.458 1.458-1.414 1.414L10.026 15.48A6.719 6.719 0 019 12.02z" />
                    </svg>
                  </div>
                  <p className="text-gray-800 font-semibold text-sm tracking-wide">
                    FUND AVAILABILITY
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
                  <div className="text-gray-500">Last Month Balance</div>
                  <div className="text-right font-semibold text-gray-700">
                    +₹{last_month_remaining_amount.toLocaleString()}
                  </div>

                  <div className="text-gray-500">Current Collection</div>
                  <div className="text-right font-semibold text-gray-700">
                    +₹{withOuntLastMonthRema.toLocaleString()}
                  </div>
                </div>

                {(() => {
                  const matchingVcMonthly = vcMonthlyData.find(
                    (m: any) =>
                      m.month == userVcMonthlyData[0]?.month &&
                      m.year == userVcMonthlyData[0]?.year,
                  );

                  if (matchingVcMonthly?.loans?.length) {
                    return (
                      <div className="mt-2 pt-2 border-t border-blue-200/50">
                        <div className="text-[10px] text-gray-400 font-bold uppercase mb-1">
                          Recent Distributions
                        </div>
                        <div className="space-y-1 max-h-24 overflow-y-auto pr-1 custom-scrollbar">
                          {matchingVcMonthly.loans.map(
                            (loan: any, idx: number) => {
                              const userName =
                                userVcMonthlyData.find(
                                  (u: any) => u.user_id._id === loan.user_id,
                                )?.user_id.name || "Unknown";
                              return (
                                <div
                                  key={idx}
                                  className="flex justify-between items-center text-xs"
                                >
                                  <span className="text-gray-600 truncate">
                                    {userName}
                                  </span>
                                  <span className="text-red-500 font-medium">
                                    -₹{loan.loan_amount?.toLocaleString()}
                                  </span>
                                </div>
                              );
                            },
                          )}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                <div className="flex justify-between items-center bg-white p-1  sm:p-2 rounded-lg border border-gray-100 mt-2 sm:mt-4 shadow-sm">
                  <span className="text-primary  font-bold text-xs">
                    MAX AVAILABLE
                  </span>
                  <span className="font-extrabold text-primary text-lg">
                    ₹{RemainingAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Loan Request Form */}
              <div className="space-y-4 px-1">
                <div className="flex justify-between items-end border-b pb-2">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                      Borrower
                    </span>
                    <span className="font-bold text-gray-800 text-base leading-tight">
                      {selectedUserForLoan.user_id?.name}
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                      Current Loan
                    </span>
                    <span className="font-bold text-gray-700">
                      ₹
                      {selectedUserForLoan.remaining_loan?.toLocaleString() ||
                        0}
                    </span>
                  </div>
                </div>

                <TextField
                  autoFocus
                  label="New Loan Amount"
                  type="number"
                  fullWidth
                  variant="outlined"
                  value={loanAmountInput}
                  onChange={(e) => setLoanAmountInput(e.target.value)}
                  InputProps={{
                    inputProps: { min: 0 },
                    startAdornment: (
                      <span className="text-gray-400 font-medium mr-1.5">
                        ₹
                      </span>
                    ),
                    className: "font-semibold text-gray-800",
                  }}
                  placeholder="0"
                  error={Number(loanAmountInput) > RemainingAmount}
                  helperText={
                    Number(loanAmountInput) > RemainingAmount
                      ? "Amount exceeds available funds"
                      : "Enter amount to lend"
                  }
                />

                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">
                    New Total Balance
                  </span>
                  <span className="text-primary font-bold text-lg">
                    ₹
                    {(
                      (selectedUserForLoan.remaining_loan || 0) +
                      (Number(loanAmountInput) || 0)
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
        <DialogActions className="p-3 bg-gray-50">
          {selectedUserForLoan ? (
            <>
              <Button onClick={() => setSelectedUserForLoan(null)} size="small">
                Back
              </Button>
              <Button
                onClick={handleCloseLoanDialog}
                color="inherit"
                size="small"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitSingleLoan}
                variant="contained"
                color="primary"
                size="small"
                disabled={
                  !loanAmountInput ||
                  Number(loanAmountInput) <= 0 ||
                  Number(loanAmountInput) > RemainingAmount
                }
              >
                Submit Loan
              </Button>
            </>
          ) : (
            <Button
              onClick={handleCloseLoanDialog}
              color="inherit"
              size="small"
            >
              Close
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Current month Summary */}
      <div className="py-8 flex justify-center">
        {(compalated || done) &&
          (() => {
            const matchingVcMonthly = vcMonthlyData.find(
              (m: any) =>
                m.month == userVcMonthlyData[0]?.month &&
                m.year == userVcMonthlyData[0]?.year,
            );

            if (!matchingVcMonthly) return null;

            const totalCollected =
              (matchingVcMonthly.total_monthly_contribution || 0) +
              (matchingVcMonthly.total_loan_vyaj || 0) +
              (matchingVcMonthly.total_loan_repayment || 0) +
              (matchingVcMonthly.total_part_payment || 0);

            return (
              <div className="w-full max-w-2xl px-4">
                <Paper className="shadow-lg rounded-2xl overflow-hidden border border-gray-100">
                  <Box className="bg-primary p-4 text-center">
                    <Typography
                      variant="h6"
                      className="text-white font-bold tracking-wide uppercase"
                    >
                      {monthName} Monthly Summary
                    </Typography>
                  </Box>

                  <div className="p-6 space-y-6">
                    {/* Opening Balance */}
                    <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <div>
                        <Typography className="text-gray-500 text-xs font-bold uppercase tracking-wider">
                          Opening Balance
                        </Typography>
                        <Typography className="text-gray-400 text-[10px]">
                          Inherited from last month
                        </Typography>
                      </div>
                      <Typography className="text-xl font-bold text-gray-800">
                        ₹
                        {matchingVcMonthly.last_month_remaining_amount?.toLocaleString() ||
                          0}
                      </Typography>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Inflows */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <Typography className="text-xs font-bold text-green-700 uppercase tracking-wider">
                            Total Collections
                          </Typography>
                        </div>
                        <div className="space-y-2 pl-4 border-l-2 border-green-100">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">
                              Monthly Contribution
                            </span>
                            <span className="font-semibold text-green-600">
                              +₹
                              {matchingVcMonthly.total_monthly_contribution?.toLocaleString() ||
                                0}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Loan Interest</span>
                            <span className="font-semibold text-green-600">
                              +₹
                              {matchingVcMonthly.total_loan_vyaj?.toLocaleString() ||
                                0}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Loan EMI</span>
                            <span className="font-semibold text-green-600">
                              +₹
                              {matchingVcMonthly.total_loan_repayment?.toLocaleString() ||
                                0}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Part Payment</span>
                            <span className="font-semibold text-green-600">
                              +₹
                              {matchingVcMonthly.total_part_payment?.toLocaleString() ||
                                0}
                            </span>
                          </div>
                          <div className="pt-2 border-t border-green-50 flex justify-between">
                            <span className="text-gray-800 font-bold">
                              Subtotal
                            </span>
                            <span className="font-bold text-green-700">
                              ₹{totalCollected.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Outflows */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                          <Typography className="text-xs font-bold text-orange-700 uppercase tracking-wider">
                            Distributions
                          </Typography>
                        </div>
                        <div className="space-y-2 pl-4 border-l-2 border-orange-100 h-full">
                          {matchingVcMonthly.loans?.length > 0 ||
                          matchingVcMonthly.exiting_members?.length > 0 ? (
                            <>
                              {matchingVcMonthly.loans?.map(
                                (loan: any, idx: number) => {
                                  const userName =
                                    userVcMonthlyData.find(
                                      (u) => u.user_id._id === loan.user_id,
                                    )?.user_id.name || "Unknown Member";
                                  return (
                                    <div
                                      key={`loan-${idx}`}
                                      className="flex justify-between text-sm"
                                    >
                                      <span
                                        className="text-gray-600 truncate max-w-[120px]"
                                        title={userName}
                                      >
                                        Loan: {userName}
                                      </span>
                                      <span className="font-semibold text-orange-600">
                                        -₹{loan.loan_amount?.toLocaleString()}
                                      </span>
                                    </div>
                                  );
                                },
                              )}
                              {matchingVcMonthly.exiting_members?.map(
                                (v: any, idx: number) => {
                                  const userName =
                                    userVcMonthlyData.find(
                                      (u) => u.user_id._id === v.user_id,
                                    )?.user_id.name || "Unknown Member";
                                  return (
                                    <div
                                      key={`exit-${idx}`}
                                      className="flex justify-between text-sm"
                                    >
                                      <span
                                        className="text-gray-600 truncate max-w-[120px]"
                                        title={userName}
                                      >
                                        Exit: {userName}
                                      </span>
                                      <span className="font-semibold text-orange-600">
                                        -₹{v.total_paid?.toLocaleString()}
                                      </span>
                                    </div>
                                  );
                                },
                              )}
                            </>
                          ) : (
                            <Typography className="text-gray-400 text-sm italic">
                              No distributions recorded
                            </Typography>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Exiting Dues Tracker */}
                    {exitingDues?.length > 0 && (
                      <div className="bg-yellow-50/50 p-4 rounded-xl border border-yellow-100">
                        <Typography className="text-xs font-bold text-yellow-800 uppercase tracking-wider mb-2">
                          Exiting Dues (Pending Repayment)
                        </Typography>
                        <div className="space-y-2">
                          {exitingDues.map((item: any) => (
                            <div
                              key={item._id}
                              className="flex justify-between items-center text-sm"
                            >
                              <span className="text-gray-700">
                                {item.user_id?.name || "Unknown"}
                              </span>
                              <div className="flex items-center gap-3">
                                <span className="font-bold text-gray-900">
                                  ₹{item.unpaid_amount.toLocaleString()}
                                </span>
                                <Button
                                  variant="outlined"
                                  size="small"
                                  className="capitalize text-[10px] h-6 px-3 border-yellow-600 text-yellow-700 hover:bg-yellow-600 hover:text-white"
                                  onClick={() =>
                                    handleOpenRepayDialog(
                                      item._id,
                                      item.unpaid_amount,
                                    )
                                  }
                                >
                                  Repay
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Closing Balance */}
                    <div className="pt-6 border-t border-gray-200">
                      <div className="flex justify-between items-center bg-primary p-4 rounded-xl shadow-inner">
                        <div>
                          <Typography className="text-white! text-xs font-bold uppercase tracking-wider opacity-80">
                            Remaining Balance
                          </Typography>
                          <Typography className="text-white! text-[10px] opacity-70">
                            Closing balance for {monthName}
                          </Typography>
                        </div>
                        <Typography className="text-2xl font-black text-white!">
                          ₹
                          {matchingVcMonthly.remaining_amount?.toLocaleString() ||
                            0}
                        </Typography>
                      </div>
                    </div>
                  </div>
                </Paper>
              </div>
            );
          })()}
      </div>

      {compalated && (
        <div className="flex justify-center gap-4 my-8 flex-wrap">
          <Button
            variant="contained"
            color="primary"
            onClick={handleOpenLoanDialog}
            className="shadow-md font-bold capitalize!"
            startIcon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
            }
          >
            New Loan
          </Button>

          {!done && (
            <Button
              variant="contained"
              color="secondary"
              onClick={() => handleLock()}
              className="shadow-md text-white! capitalize! font-bold"
            >
              Finalize this month
            </Button>
          )}

          <Link href={`/leave-vc/${vcId}`} passHref>
            <Button
              variant="outlined"
              color="primary"
              className="shadow-md font-bold"
              startIcon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
                  />
                </svg>
              }
            >
              Mange Member
            </Button>
          </Link>
        </div>
      )}

      {done && (
        <React.Suspense fallback={<CircularProgress />}>
          <NextMonthData id={vcId} />
        </React.Suspense>
      )}
    </div>
  );
};

export default MemberTableUI;
