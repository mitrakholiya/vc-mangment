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

interface VcUserMonthly {
  _id: string;
  user_id: {
    _id: string;
    name: string;
    email: string;
  };
  monthly_contribution: number;
  loan_amount: number;
  remaining_loan: number;
  loan_monthly_emi: number;
  loan_interest: number;
  part_payment: number;
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
}) => {
  // Local State for Dialogs

  // New state for loan modal
  const [isLoanModalOpen, setIsLoanModalOpen] = React.useState(false);
  const [selectedUserForLoan, setSelectedUserForLoan] = React.useState<
    any | null
  >(null);
  const [loanAmountInput, setLoanAmountInput] = React.useState("");

  // Approve Dialog State
  const [isApproveDialogOpen, setIsApproveDialogOpen] = React.useState(false);
  const [approveSelectedId, setApproveSelectedId] = React.useState<
    string | null
  >(null);
  const [partPaymentInput, setPartPaymentInput] = React.useState("");

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

  const handleSelectUserForLoan = (user: any) => {
    setSelectedUserForLoan(user);
    setLoanAmountInput("");
  };

  const handleSubmitSingleLoan = async () => {
    if (!selectedUserForLoan || !loanAmountInput) return;

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
  };

  // Keep original for backward compatibility if needed, or remove if unused
  //   const handleSubmitLoanDistribution = async () => {
  //     const res = await loanDistribution({ loan: loanMap, id });
  //     if (res?.success === true) {
  //       toast.success(res?.message);
  //       refetch();
  //       setLoanMap({});
  //     } else {
  //       toast.error("Something Went Wrong");
  //       refetch();
  //     }
  //   };

  const compalated = userVcMonthlyData?.every(
    (row: any) => row.status === "approved",
  );

  //   const compalated = true;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <CircularProgress />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center text-red-500 py-4">
        Error: {(error as Error).message}
      </div>
    );
  }

  if (userVcMonthlyData.length === 0) {
    return (
      <Typography variant="body1" className="text-center py-4">
        No contribution data found.
      </Typography>
    );
  }

  // Calculate Totals
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

  const handleOpenApproveDialog = async (id: string, loanAmount: number) => {
    // If loan amount is 0, approve directly
    if (loanAmount <= 0) {
      const res = await onApprove(id, loanAmount);

      if (res?.success === true) {
        toast.success("Approved successfully");
        refetch();
      } else {
        toast.error(res?.message || "Something Went Wrong");
      }
    }else{
    setApproveSelectedId(id);
    setPartPaymentInput("");
    setIsApproveDialogOpen(true);
    }
  };

  const handleCloseApproveDialog = () => {
    setIsApproveDialogOpen(false);
    setApproveSelectedId(null);
    setPartPaymentInput("");
  };

  const handleConfirmApprove = async () => {
    if (!approveSelectedId) return;
    const partPayment = partPaymentInput ? Number(partPaymentInput) : 0;

    // Call mutation with object
    const res = await onApprove(approveSelectedId, partPayment);

    if (res?.success === true) {
      toast.success("Approved successfully");
      refetch();
      handleCloseApproveDialog();
    } else {
      toast.error(res?.message || "Something Went Wrong");
      handleCloseApproveDialog();
    }
  };

  // Month/Year passed as props

  return (
    <div className="mt-4">
      <Typography className="text-sm mb-2 font-extrabold px-1">
        {monthName} {year}
      </Typography>
      <TableContainer
        component={Paper}
        className="shadow-md rounded-lg text-[8px]"
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
          <TableHead className="bg-gray-100">
            <TableRow>
              <TableCell sx={{ width: "25px", p: "2px" }}>
                <strong>No.</strong>
              </TableCell>
              <TableCell sx={{ width: "80px", p: "2px" }}>
                <strong>Name</strong>
              </TableCell>
              <TableCell align="right" sx={{ width: "50px", p: "2px" }}>
                <strong>Monthly hapto</strong>
              </TableCell>
              <TableCell align="right" sx={{ width: "60px", p: "2px" }}>
                <strong>Loan</strong>
              </TableCell>
              <TableCell align="right" sx={{ width: "50px", p: "2px" }}>
                <strong>Part Payment </strong>
              </TableCell>
              <TableCell align="right" sx={{ width: "50px", p: "2px" }}>
                <strong>Remaining Loan</strong>
              </TableCell>
              <TableCell align="right" sx={{ width: "50px", p: "2px" }}>
                <strong>Loan Interest</strong>
              </TableCell>
              <TableCell align="right" sx={{ width: "50px", p: "2px" }}>
                <strong>Loan EMI</strong>
              </TableCell>
              <TableCell align="right" sx={{ width: "60px", p: "2px" }}>
                <strong>Total</strong>
              </TableCell>
              <TableCell align="center" sx={{ width: "80px", p: "2px" }}>
                <strong>Action</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {userVcMonthlyData.map((row, index) => (
              <TableRow
                key={row._id}
                sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                className="hover:bg-gray-50 transition-colors"
              >
                <TableCell component="th" scope="row">
                  {index + 1}
                </TableCell>
                <TableCell
                  sx={{
                    maxWidth: "80px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {row.user_id?.name || "Unknown"}
                </TableCell>
                <TableCell align="right">
                  ₹{row.monthly_contribution.toLocaleString()}
                </TableCell>
                <TableCell align="right">
                  {row.loan_amount > 0
                    ? `₹${row.loan_amount.toLocaleString()}`
                    : "-"}
                </TableCell>
                <TableCell align="right">
                  {row.part_payment > 0
                    ? `₹${row.part_payment.toLocaleString()}`
                    : "-"}
                </TableCell>
                <TableCell align="right">
                  {row.remaining_loan > 0
                    ? `₹${row.remaining_loan.toLocaleString()}`
                    : "-"}
                </TableCell>
                <TableCell align="right">
                  {row.loan_monthly_emi > 0
                    ? `₹${row.loan_monthly_emi.toLocaleString()}`
                    : "-"}
                </TableCell>
                <TableCell align="right">
                  {row.loan_interest > 0
                    ? `₹${row.loan_interest.toLocaleString()}`
                    : "-"}
                </TableCell>
                <TableCell align="right">
                  ₹{row.total_payable.toLocaleString()}
                </TableCell>
                <TableCell align="center">
                  <div className="flex items-center justify-center gap-1">
                    {row.status !== "approved" && (
                      <>
                        <span
                          className={`px-3 py-0.5 rounded-xl text-[9px] font-medium cursor-pointer ${
                            row.status === "pending"
                              ? "bg-yellow-500 text-white"
                              : row.status === "paid"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-yellow-800 border-[1px]"
                          }`}
                          onClick={() =>
                            handleOpenApproveDialog(row._id, row.loan_amount)
                          }
                        >
                          {/* {row.status === "none"
                            ? "P"
                            : row.status.charAt(0).toUpperCase()} */}
                          {(row.status === "pending" ||
                            row.status === "none") && (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={2}
                              className="w-3 h-3 ml-1 inline-block"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                              />
                            </svg>
                          )}
                        </span>
                        {/* <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          sx={{
                            fontSize: "8px",
                            padding: "2px 4px",
                            minWidth: "45px",
                            textTransform: "none",
                          }}
                        >
                          Approve
                        </Button> */}
                      </>
                    )}
                    {row.status === "approved" && (
                      <span className="flex items-center text-green-600 text-xs font-bold">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="w-4 h-4 ml-1"
                        >
                          <path
                            fillRule="evenodd"
                            d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {/* Total Row */}
            <TableRow className="bg-gray-200 font-bold">
              <TableCell colSpan={2} align="center">
                <strong>Total</strong>
              </TableCell>
              <TableCell align="right">
                <strong>₹{totalMonthlyContribution.toLocaleString()}</strong>
              </TableCell>
              <TableCell align="right">
                <strong>
                  {totalLoanAmount > 0
                    ? `₹${totalLoanAmount.toLocaleString()}`
                    : "-"}
                </strong>
              </TableCell>
              <TableCell align="right">
                <strong>
                  {totalPartPayment > 0
                    ? `₹${totalPartPayment.toLocaleString()}`
                    : "-"}
                </strong>
              </TableCell>
              <TableCell align="right">
                <strong>
                  {totalRemainingLoan > 0
                    ? `₹${totalRemainingLoan.toLocaleString()}`
                    : "-"}
                </strong>
              </TableCell>
              <TableCell align="right">
                <strong>
                  {totalLoanEmi > 0 ? `₹${totalLoanEmi.toLocaleString()}` : "-"}
                </strong>
              </TableCell>
              <TableCell align="right">
                <strong>
                  {totalLoanInterest > 0
                    ? `₹${totalLoanInterest.toLocaleString()}`
                    : "-"}
                </strong>
              </TableCell>
              <TableCell align="right">
                <strong>₹{totalPayable.toLocaleString()}</strong>
              </TableCell>
              {/* Empty cell for Action column in Total Row */}
              <TableCell></TableCell>
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
            <TextField
              autoFocus
              label="Part Payment (Optional)"
              type="number"
              fullWidth
              variant="outlined"
              size="small"
              value={partPaymentInput}
              onChange={(e) => setPartPaymentInput(e.target.value)}
              placeholder="Enter amount if any"
              helperText="This amount will be deducted from remaining loan"
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

      {/* add new Loan Section */}
      {compalated && (
        <div className="fixed bottom-10 right-6 z-50">
          <Fab
            variant="extended"
            color="secondary"
            aria-label="add loan"
            onClick={handleOpenLoanDialog}
            className="shadow-lg font-bold"
            size="medium"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5 mr-2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            New Loan
          </Fab>
        </div>
      )}

      {/* Add Loan Dialog */}
      <Dialog
        open={isLoanModalOpen}
        onClose={handleCloseLoanDialog}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle className="text-sm font-bold">
          {selectedUserForLoan
            ? `Loan for ${selectedUserForLoan.user_id?.name}`
            : "Select User for Loan"}
        </DialogTitle>
        <DialogContent dividers>
          {!selectedUserForLoan ? (
            <List dense className="max-h-[300px] overflow-auto">
              {userVcMonthlyData.map((user) => (
                <ListItemButton
                  key={user._id}
                  onClick={() => handleSelectUserForLoan(user)}
                  className="hover:bg-gray-50 border-b last:border-0"
                >
                  <ListItemText
                    primary={
                      <span className="font-semibold text-sm">
                        {user.user_id?.name}
                      </span>
                    }
                    secondary={
                      <span className="text-xs text-gray-500">
                        Current Loan: ₹
                        {user.remaining_loan?.toLocaleString() || 0}
                      </span>
                    }
                  />
                  <span className="text-blue-600 text-xs font-bold">
                    Select
                  </span>
                </ListItemButton>
              ))}
            </List>
          ) : (
            <Box className="space-y-4 pt-2">
              <div className="bg-gray-50 p-3 rounded-lg flex justify-between items-center text-sm mb-4">
                <span className="text-gray-600">Current Loan Balance:</span>
                <span className="font-bold text-gray-900">
                  ₹{selectedUserForLoan.remaining_loan?.toLocaleString() || 0}
                </span>
              </div>

              <TextField
                autoFocus
                label="New Loan Amount"
                type="number"
                fullWidth
                variant="outlined"
                size="small"
                value={loanAmountInput}
                onChange={(e) => setLoanAmountInput(e.target.value)}
                InputProps={{ inputProps: { min: 0 } }}
                placeholder="Enter amount"
              />

              <div className="flex justify-between text-sm font-bold border-t pt-3 mt-2 text-gray-800">
                <span>Total Loan:</span>
                <span className="text-green-600 text-lg">
                  ₹
                  {(
                    (selectedUserForLoan.remaining_loan || 0) +
                    (Number(loanAmountInput) || 0)
                  ).toLocaleString()}
                </span>
              </div>
            </Box>
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
                disabled={!loanAmountInput || Number(loanAmountInput) <= 0}
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
    </div>
  );
};

export default MemberTableUI;
