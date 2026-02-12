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
  Alert,
} from "@mui/material";
import { useGetNextMonthData } from "@/hooks/contribution/useContribution";

interface NextMonthDataProps {
  id: string; // VC ID
}

const NextMonthData: React.FC<NextMonthDataProps> = ({ id }) => {
  const { data, isLoading, isError, error } = useGetNextMonthData(id);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <CircularProgress size={30} />
      </div>
    );
  }

  if (isError) {
    return (
      <Alert severity="error" className="my-4">
        Failed to load next month data: {(error as Error).message}
      </Alert>
    );
  }

  const userVcMonthlyData = data?.data?.user_vc_monthly || [];
  const vcMonthly = data?.data?.vc_monthly;

  if (userVcMonthlyData.length === 0 && !vcMonthly) {
    return (
      <div className="text-center text-gray-500 py-8 italic border border-dashed rounded-lg bg-gray-50">
        Next month data verification not available yet.
        <br />
        <span className="text-xs">
          (Data is generated when the current month is locked)
        </span>
      </div>
    );
  }

  const firstRecord = userVcMonthlyData[0];
  const monthName = firstRecord
    ? new Date(0, firstRecord.month - 1).toLocaleString("default", {
        month: "long",
      })
    : "Next Month";
  const year = firstRecord?.year || "";

  return (
    <div className="mt-8 mb-4">
      <Typography variant="h6" className="font-bold text-gray-800 mb-3 px-1">
        Next Month Projection ({monthName} {year})
      </Typography>

      <TableContainer
        component={Paper}
        className="shadow-sm border rounded-lg overflow-hidden"
      >
        <Table size="small" aria-label="next month table">
          <TableHead className="bg-blue-50">
            <TableRow>
              <TableCell className="font-bold text-xs" width="40px">
                No.
              </TableCell>
              <TableCell className="font-bold text-xs">Name</TableCell>
              <TableCell align="right" className="font-bold text-xs">
                Baki Loan
              </TableCell>
              <TableCell align="right" className="font-bold text-xs">
                Loan Hapto
              </TableCell>
              <TableCell align="right" className="font-bold text-xs">
                Vyaj
              </TableCell>
              <TableCell align="right" className="font-bold text-xs">
                Hapto
              </TableCell>
              <TableCell align="right" className="font-bold text-xs">
                Total Payable
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {userVcMonthlyData.map((row: any, index: number) => (
              <TableRow
                key={row._id}
                className="hover:bg-gray-50 transition-colors"
              >
                <TableCell component="th" scope="row" className="text-xs">
                  {index + 1}
                </TableCell>
                <TableCell className="text-xs font-semibold text-gray-700">
                  {row.user_id?.name || "Unknown"}
                </TableCell>
                <TableCell align="right" className="text-xs text-gray-600">
                  {row.remaining_loan > 0
                    ? `₹${row.remaining_loan.toFixed(2).toLocaleString()}`
                    : "-"}
                </TableCell>
                <TableCell align="right" className="text-xs text-blue-600">
                  {row.loan_monthly_emi > 0
                    ? `₹${row.loan_monthly_emi.toFixed(2).toLocaleString()}`
                    : "-"}
                </TableCell>
                <TableCell align="right" className="text-xs text-blue-600">
                  {row.loan_interest > 0
                    ? `₹${row.loan_interest.toFixed(2).toLocaleString()}`
                    : "-"}
                </TableCell>
                <TableCell align="right" className="text-xs text-green-600">
                  ₹{row.monthly_contribution.toFixed(2).toLocaleString()}
                </TableCell>
                <TableCell align="right" className="text-xs font-bold">
                  ₹{row.total_payable.toFixed(2).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
            {userVcMonthlyData.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  align="center"
                  className="py-4 text-gray-500"
                >
                  No member data found for next month.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {vcMonthly && (
        <div className="mt-2 text-xs text-gray-500 text-right px-2">
          Opening Balance for Venture: ₹
          {vcMonthly.last_month_remaining_amount?.toLocaleString()}
        </div>
      )}
    </div>
  );
};

export default NextMonthData;
