import React from "react";
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
} from "@mui/material";

import { useGetVcHistory } from "@/hooks/contribution/useContribution";
import Loading from "../Loading";
import { shareMemberStatementPdf } from "@/lib/shareMemberStatement";

interface ViewHistoryProps {
  id: string; // VC ID
}

const ViewHistory: React.FC<ViewHistoryProps> = ({ id }) => {
  const { data, isLoading, isError, error } = useGetVcHistory(id);

  if (isLoading) {
    return <Loading />;
  }

  if (isError) {
    return (
      <Alert severity="error" className="my-4">
        Failed to load history: {(error as Error).message}
      </Alert>
    );
  }

  const vcMonthlyList = data?.data?.vc_monthly || []; // List of months
  const allUserRecords = data?.data?.user_vc_monthly || [];
  const venture = data?.data?.venture;
  const exitingPanding = venture?.exiting_panding || [];

  if (
    vcMonthlyList.length === 0 &&
    allUserRecords.length === 0 &&
    exitingPanding.length === 0
  ) {
    return (
      <Typography variant="body1" className="text-center py-8 text-gray-500">
        No history records found for this venture.
      </Typography>
    );
  }

  // Helper to filter user records for a specific month
  const getUserRecordsForMonth = (month: number, year: number) => {
    return allUserRecords.filter(
      (r: any) => r.month === month && r.year === year,
    );
  };

  const getMonthName = (month: number) => {
    return new Date(0, month - 1).toLocaleString("default", { month: "long" });
  };

  return (
    <div className=" space-y-6">
      <div className="flex items-center gap-2">
        <h6 className="text-3xl px-1 mb-4 font-secondary font-extrabold!">
          Venture <span className="text-primary">History</span>
        </h6>
        <div className="h-px bg-primary flex-1"></div>
      </div>

      {vcMonthlyList.map((monthRecord: any) => {
        const monthName = getMonthName(monthRecord.month);
        const usersForMonth = getUserRecordsForMonth(
          monthRecord.month,
          monthRecord.year,
        );

        return (
          <Accordion
            key={monthRecord._id}
            defaultExpanded={false}
            className="border rounded-lg shadow-sm"
          >
            <AccordionSummary
              expandIcon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5 text-gray-500"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m19.5 8.25-7.5 7.5-7.5-7.5"
                  />
                </svg>
              }
              className="bg-gray-50 hover:bg-gray-100"
            >
              <div className="flex justify- tween items-center justify-between w-full pr-4">
                <Typography className="font-bold text-gray-800">
                  {monthName} {monthRecord.year}
                </Typography>
                <div className="text-xs text-gray-500 flex items-center gap-4">
                  <span>
                    Collection:{" "}
                    <span className="font-semibold text-green-700">
                      ₹
                      {(
                        (monthRecord.total_monthly_contribution || 0) +
                        (monthRecord.total_loan_vyaj || 0) +
                        (monthRecord.total_loan_repayment || 0) +
                        (monthRecord.total_part_payment || 0)
                      ).toLocaleString()}
                    </span>
                  </span>
                  {monthRecord.lock && (
                    <span className="text-gray-700 font-bold bg-green-200 px-2 py-0.5 rounded border border-green-300">
                      LOCKED
                    </span>
                  )}
                </div>
              </div>
            </AccordionSummary>
            <AccordionDetails className="p-0">
              {/* Summary Section */}
              <div className="p-4 bg-white border-b">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-primary block">Opening Balance</span>
                    <span className="font-bold text-lg">
                      ₹
                      {monthRecord.last_month_remaining_amount?.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-green-600 block sm:text-left text-right">
                      Total Collected
                    </span>
                    <span className="font-bold block text-lg text-green-700 sm:text-left text-right">
                      ₹
                      {(
                        (monthRecord.total_monthly_contribution || 0) +
                        (monthRecord.total_loan_vyaj || 0) +
                        (monthRecord.total_loan_repayment || 0) +
                        (monthRecord.total_part_payment || 0)
                      ).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-secondary block">New Loans</span>
                    <span className="font-bold text-lg  text-secondary">
                      ₹
                      {monthRecord.loans
                        ?.reduce(
                          (acc: number, curr: any) =>
                            acc + (curr.loan_amount || 0),
                          0,
                        )
                        .toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-primary block sm:text-left text-right">
                      Final Remaining
                    </span>
                    <span className="font-bold text-lg sm:text-left text-right block">
                      ₹{monthRecord.remaining_amount?.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* VC Summary Table */}
              <TableContainer
                component={Paper}
                elevation={0}
                className="mb-4 border-b"
              >
                <Typography className="p-3 font-bold! text-sm bg-gray-50 text-primary ">
                  VC Monthly Summary
                </Typography>
                <Table size="small">
                  <TableHead className="bg-primary  ">
                    <TableRow>
                      <TableCell
                        align="center"
                        className="font-bold text-white! text-xs"
                      >
                        Opening Balance
                      </TableCell>
                      <TableCell
                        align="center"
                        className="font-bold text-white! text-xs"
                      >
                        Total Hapto
                      </TableCell>
                      <TableCell
                        align="center"
                        className="font-bold text-white! text-xs"
                      >
                        Total Interest
                      </TableCell>
                      <TableCell
                        align="center"
                        className="font-bold text-white! text-xs"
                      >
                        Total Loan Hapto
                      </TableCell>
                      <TableCell
                        align="center"
                        className="font-bold text-white! text-xs"
                      >
                        Part Payment
                      </TableCell>
                      <TableCell
                        align="center"
                        className="font-bold text-white! text-xs"
                      >
                        Total Fund
                      </TableCell>
                      <TableCell
                        align="center"
                        className="font-bold text-white! text-xs"
                      >
                        New Loans
                      </TableCell>
                      <TableCell
                        align="center"
                        className="font-bold text-white! text-xs"
                      >
                        Final Balance
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell align="center" className="text-xs font-medium">
                        ₹
                        {monthRecord.last_month_remaining_amount?.toLocaleString()}
                      </TableCell>
                      <TableCell
                        align="center"
                        className="text-xs text-green-600"
                      >
                        ₹
                        {monthRecord.total_monthly_contribution?.toLocaleString()}
                      </TableCell>
                      <TableCell
                        align="center"
                        className="text-xs text-blue-600"
                      >
                        ₹{monthRecord.total_loan_vyaj?.toLocaleString()}
                      </TableCell>
                      <TableCell align="center" className="text-xs">
                        ₹{monthRecord.total_loan_repayment?.toLocaleString()}
                      </TableCell>
                      <TableCell
                        align="center"
                        className="text-xs text-purple-600"
                      >
                        ₹{monthRecord.total_part_payment?.toLocaleString()}
                      </TableCell>
                      <TableCell
                        align="center"
                        className="text-xs font-bold text-green-700"
                      >
                        ₹{monthRecord.total?.toLocaleString()}
                      </TableCell>
                      <TableCell
                        align="center"
                        className="text-xs text-red-600"
                      >
                        ₹
                        {monthRecord.loans
                          ?.reduce(
                            (acc: number, curr: any) =>
                              acc + (curr.loan_amount || 0),
                            0,
                          )
                          .toLocaleString()}
                      </TableCell>
                      <TableCell align="center" className="text-xs font-bold">
                        ₹{monthRecord.remaining_amount?.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              {/* New Loans Details Table */}
              {monthRecord.loans?.length > 0 && (
                <TableContainer
                  component={Paper}
                  elevation={0}
                  className="mb-4 border-b"
                >
                  <Typography className="p-3 font-bold! text-sm bg-gray-50 text-secondary ">
                    New Loans Issued Details
                  </Typography>
                  <Table size="small">
                    <TableHead className="bg-secondary">
                      <TableRow>
                        <TableCell className="font-bold text-white! text-xs">
                          Member Name
                        </TableCell>
                        <TableCell
                          align="center"
                          className="font-bold text-white! text-xs"
                        >
                          Loan Amount
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {monthRecord.loans.map((loan: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell className="text-xs font-medium">
                            {loan.user_id?.name || "Unknown"}
                          </TableCell>
                          <TableCell
                            align="center"
                            className="text-xs font-bold text-red-600"
                          >
                            ₹{loan.loan_amount?.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {/* User Table */}
              <TableContainer component={Paper} elevation={0}>
                <Table size="small">
                  <TableHead className="bg-primary">
                    <TableRow>
                      <TableCell
                        className="font-bold text-white! text-xs"
                        sx={{
                          position: "sticky",
                          left: 0,
                          backgroundColor: "#04594A",
                        }}
                      >
                        Name
                      </TableCell>
                      <TableCell
                        align="center"
                        className="font-bold text-white! text-xs"
                      >
                        Contribution(Hapto)
                      </TableCell>
                      <TableCell
                        align="center"
                        className="font-bold text-white! text-xs"
                      >
                        Loan
                      </TableCell>
                      <TableCell
                        align="center"
                        className="font-bold text-white! text-xs"
                      >
                        Baki Loan
                      </TableCell>
                      <TableCell
                        align="center"
                        className="font-bold text-white! text-xs"
                      >
                        Loan Hapto
                      </TableCell>
                      <TableCell
                        align="center"
                        className="font-bold text-white! text-xs"
                      >
                        Loan Interest
                      </TableCell>
                      <TableCell
                        align="center"
                        className="font-bold text-white! text-xs"
                      >
                        Part Payment
                      </TableCell>
                      <TableCell
                        align="center"
                        className="font-bold text-white! text-xs"
                      >
                        Total
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {usersForMonth.map((user: any) => (
                      <TableRow key={user._id} className="hover:bg-gray-50">
                        <TableCell
                          className="text-xs font-medium"
                          sx={{
                            position: "sticky",
                            left: 0,
                            backgroundColor: "#f9fafb",
                          }}
                        >
                          {user.user_id?.name || "Unknown"}
                        </TableCell>
                        <TableCell align="right" className="text-xs">
                          ₹{user.monthly_contribution?.toLocaleString()}
                        </TableCell>
                        <TableCell
                          align="right"
                          className="text-xs text-red-600 font-medium"
                        >
                          {user.loan_amount > 0
                            ? `₹${user.loan_amount.toLocaleString()}`
                            : "-"}
                        </TableCell>
                        <TableCell align="right" className="text-xs">
                          {user.remaining_loan > 0
                            ? `₹${user.remaining_loan.toLocaleString()}`
                            : "-"}
                        </TableCell>
                        <TableCell align="right" className="text-xs">
                          ₹{(user.loan_monthly_emi || 0).toLocaleString()}
                        </TableCell>
                        <TableCell align="right" className="text-xs">
                          ₹{user.loan_interest?.toLocaleString()}
                        </TableCell>
                        <TableCell
                          align="right"
                          className="text-xs text-blue-600"
                        >
                          {user.part_payment > 0
                            ? `₹${user.part_payment.toLocaleString()}`
                            : "-"}
                        </TableCell>
                        <TableCell align="right">
                          <span>
                            ₹
                            {(
                              (user.monthly_contribution || 0) +
                              (user.loan_monthly_emi || 0) +
                              (user.loan_interest || 0) +
                              (user.part_payment || 0)
                            ).toLocaleString()}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                    {usersForMonth.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="text-center text-xs py-4 text-gray-400"
                        >
                          No member records found for this month.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              {/* Exiting Members Table */}
              {monthRecord.exiting_members?.length > 0 && (
                <TableContainer
                  component={Paper}
                  elevation={0}
                  className="mt-4 border-t"
                >
                  <Typography className="p-3 font-bold! text-sm bg-gray-50 text-secondary ">
                    Exiting Members
                  </Typography>
                  <Table size="small">
                    <TableHead className="bg-secondary">
                      <TableRow>
                        <TableCell className="font-bold text-white! text-xs"
                        sx={{position:"sticky",left:0,backgroundColor:"#BF9227"}}>
                          Name
                        </TableCell>
                        <TableCell
                          align="center"
                          className="font-bold text-white! text-xs"
                        >
                          Total Contribution
                        </TableCell>
                        <TableCell
                          align="center"
                          className="font-bold text-white! text-xs"
                        >
                          Remaining Loan
                        </TableCell>
                        <TableCell
                          align="center"
                          className="font-bold text-white! text-xs"
                        >
                          Total Vyaj
                        </TableCell>
                        <TableCell
                          align="center"
                          className="font-bold text-white! text-xs"
                        >
                          Final Amount
                        </TableCell>
                        <TableCell
                          align="center"
                          className="font-bold text-white! text-xs"
                        >
                          Paid Amount
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {monthRecord.exiting_members.map((member: any) => (
                        <TableRow key={member.user_id?._id || member.user_id}>
                          <TableCell className="text-xs font-medium"
                          sx={{position:"sticky",left:0,backgroundColor:"#f9fafb"}}>
                            {member.user_id?.name || "Unknown"}
                          </TableCell>
                          <TableCell align="center" className="text-xs">
                            ₹
                            {member.total_monthly_contribution?.toLocaleString()}
                          </TableCell>
                          <TableCell
                            align="center"
                            className="text-xs text-red-600"
                          >
                            ₹{member.remaning_loan?.toLocaleString()}
                          </TableCell>
                          <TableCell
                            align="center"
                            className="text-xs text-blue-600"
                          >
                            ₹{member.total_vyaj?.toLocaleString()}
                          </TableCell>
                          <TableCell
                            align="center"
                            className="text-xs font-bold"
                          >
                            ₹{member.total?.toLocaleString()}
                          </TableCell>
                          <TableCell
                            align="center"
                            className="text-xs font-bold text-green-700"
                          >
                            ₹{member.total_paid?.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </AccordionDetails>
          </Accordion>
        );
      })}

      {/* Leaving Members Accordion */}
      {exitingPanding.length > 0 && (
        <Accordion className="border rounded-lg shadow-sm overflow-hidden">
          <AccordionSummary
            expandIcon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5 text-gray-500"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m19.5 8.25-7.5 7.5-7.5-7.5"
                />
              </svg>
            }
            className="bg-red-50 hover:bg-red-100"
          >
            <Typography className="font-bold text-secondary flex items-center gap-2">
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
              Leaving Members (Pending Dues)
            </Typography>
          </AccordionSummary>
          <AccordionDetails className="p-6 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {exitingPanding.map((member: any) => (
                <div
                  key={member._id}
                  className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-6 shadow-sm relative overflow-hidden"
                >
                  {/* Document Header */}
                  <div className="flex justify-between items-start mb-6 border-b pb-4">
                    <div>
                      <Typography className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                        Member Statement
                      </Typography>
                      <Typography
                        variant="h6"
                        className="font-extrabold text-gray-900"
                      >
                        {member.user_id?.name || "Unknown"}
                      </Typography>
                      <Typography className="text-xs text-gray-500">
                        {member.user_id?.email}
                      </Typography>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          shareMemberStatementPdf(member, "VC", "download")
                        }
                        className="p-1.5 bg-gray-100 text-gray-600 rounded-full hover:bg-primary hover:text-white transition-colors border border-gray-200"
                        title="Download Statement"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-4 h-4"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() =>
                          shareMemberStatementPdf(member, "VC", "share")
                        }
                        className="p-1.5 bg-gray-100 text-gray-600 rounded-full hover:bg-secondary hover:text-white transition-colors border border-gray-200"
                        title="Share Statement"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-4 h-4"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0-10.628a2.25 2.25 0 1 0 3.935-2.186 2.25 2.25 0 0 0-3.935 2.186Zm0 12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Document Body */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm border-b border-gray-100 pb-2">
                      <span className="text-gray-500">Total Contribution</span>
                      <span className="font-bold">
                        ₹{member.total_monthly_contribution?.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-sm border-b border-gray-100 pb-2">
                      <span className="text-gray-500">
                        Total Interest (Vyaj)
                      </span>
                      <span className="font-bold text-primary">
                        ₹{member.total_vyaj?.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-sm border-b border-gray-100 pb-2">
                      <span className="text-gray-500">Remaining Loan</span>
                      <span className="font-bold text-secondary">
                        ₹{member.remaining_loan?.toLocaleString()}
                      </span>
                    </div>
                    

                    <div className="flex justify-between items-center text-sm border-b border-gray-100 pb-2">
                      <span className="text-gray-500">
                        Total
                      </span>
                      <span className="font-bold text-primary">
                        ₹{(member.total_monthly_contribution + member.total_vyaj - member.remaining_loan).toLocaleString()}
                      </span>
                    </div>

                    <div className="mt-6 pt-4 bg-gray-50 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-gray-400 uppercase">
                          Unpaid Amount
                        </span>
                        <span className="text-xl font-black text-gray-900">
                          ₹{member.unpaid_amount?.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {member.total_paid?.length > 0 && (
                      <div className="mt-6">
                        <Typography className="text-xs font-bold text-gray-400 uppercase mb-3 px-1">
                          Payment History
                        </Typography>
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                          {member.total_paid.map(
                            (payment: any, idx: number) => (
                              <div
                                key={idx}
                                className="flex justify-between items-center bg-green-50 p-2 rounded border border-green-100"
                              >
                                <span className="text-xs font-medium text-green-800">
                                  {new Date(payment.date).toLocaleDateString(
                                    "en-IN",
                                    {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    },
                                  )}
                                </span>
                                <span className="text-xs font-bold text-green-900">
                                  ₹{payment.amount?.toLocaleString()}
                                </span>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Watermark for document feel */}
                  <div className="absolute -bottom-4 -right-4 opacity-5 pointer-events-none transform -rotate-12">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-32 h-32"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .415.117.808.322 1.148m-2.214-.151a.502.502 0 0 1-.322-.148l-1.243-1.243a.502.502 0 0 1 .148-.322l1.243-1.243a.502.502 0 0 1 .322-.148l1.243 1.243c.151.151.246.354.246.579 0 .225-.095.428-.246.579l-1.243 1.243Zm-5.696 7.203a9.003 9.003 0 0 0 12.396 12.396m-1.944-8.944 1.243-1.243a.502.502 0 0 1 .322-.148l1.243 1.243a.502.502 0 0 1 .148.322l-1.243 1.243a.502.502 0 0 1-.322.148l-1.243-1.243a.502.502 0 0 1-.148-.322l1.243-1.243ZM15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
                      />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </AccordionDetails>
        </Accordion>
      )}
    </div>
  );
};

export default ViewHistory;
