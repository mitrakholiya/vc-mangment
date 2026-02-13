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

interface ViewHistoryProps {
  id: string; // VC ID
}

const ViewHistory: React.FC<ViewHistoryProps> = ({ id }) => {
  const { data, isLoading, isError, error } = useGetVcHistory(id);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <CircularProgress />
      </div>
    );
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

  if (vcMonthlyList.length === 0 && allUserRecords.length === 0) {
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
        <h6 className="font-bold text-3xl px-1 mb-4 font-secondary font-extrabold!">
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
                    <span className="text-green-600 block text-right">
                      Total Collected
                    </span>
                    <span className="font-bold block text-lg text-green-700 text-right">
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
                    <span className="text-primary block text-right">
                      Final Remaining
                    </span>
                    <span className="font-bold text-lg text-right block">
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
                      <TableCell align="center" className="font-bold text-white! text-xs">
                        Opening Balance
                      </TableCell>
                      <TableCell align="center" className="font-bold text-white! text-xs">
                        Total Hapto
                      </TableCell>
                      <TableCell align="center" className="font-bold text-white! text-xs">
                        Total Interest
                      </TableCell>
                      <TableCell align="center" className="font-bold text-white! text-xs">
                        Total Loan Hapto
                      </TableCell>
                      <TableCell align="center" className="font-bold text-white! text-xs">
                        Part Payment
                      </TableCell>
                      <TableCell align="center" className="font-bold text-white! text-xs">
                        Total Fund
                      </TableCell>
                      <TableCell align="center" className="font-bold text-white! text-xs">
                        New Loans
                      </TableCell>
                      <TableCell align="center" className="font-bold text-white! text-xs">
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

              {/* User Table */}
              <TableContainer component={Paper} elevation={0}>
                <Table size="small">
                  <TableHead className="bg-primary">
                    <TableRow>
                      <TableCell className="font-bold text-white! text-xs"
                      sx={{
                        position:"sticky",
                        left:0,
                        backgroundColor:"#04594A",
                      }}
                      >Name</TableCell>
                      <TableCell align="center" className="font-bold text-white! text-xs">
                        Contribution(Hapto)
                      </TableCell>
                      <TableCell align="center" className="font-bold text-white! text-xs">
                        Loan
                      </TableCell>
                      <TableCell align="center" className="font-bold text-white! text-xs">
                        Baki Loan
                      </TableCell>
                      <TableCell align="center" className="font-bold text-white! text-xs">
                        Loan Hapto
                      </TableCell>
                      <TableCell align="center" className="font-bold text-white! text-xs">
                        Loan Interest
                      </TableCell>
                      <TableCell align="center" className="font-bold text-white! text-xs">
                        Part Payment
                      </TableCell>
                      <TableCell align="center" className="font-bold text-white! text-xs">
                        Total
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {usersForMonth.map((user: any) => (
                      <TableRow key={user._id} className="hover:bg-gray-50">
                        <TableCell className="text-xs font-medium"
                        sx={{
                          position:"sticky",
                          left:0,
                          backgroundColor:"#f9fafb",
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
            </AccordionDetails>
          </Accordion>
        );
      })}
    </div>
  );
};

export default ViewHistory;
