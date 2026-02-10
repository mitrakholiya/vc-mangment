import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress,
  Slider,
} from "@mui/material";

interface TakeLoanModalProps {
  open: boolean;
  onClose: () => void;
  vcId: string;
  maxLoanAmount: number;
  fundWallet: number;
  interestRate: number;
  loanRepaymentPercent: number;
  onTakeLoan: (amount: number) => Promise<void>;
  isLoading?: boolean;
}

export default function TakeLoanModal({
  open,
  onClose,
  vcId,
  maxLoanAmount,
  fundWallet,
  interestRate,
  loanRepaymentPercent,
  onTakeLoan,
  isLoading,
}: TakeLoanModalProps) {
  const [loanAmount, setLoanAmount] = useState<number>(0);

  // Calculate loan details
  const interest = (loanAmount * interestRate) / 100;
  const repayment = (loanAmount * loanRepaymentPercent) / 100;
  const monthlyEMI = interest + repayment;

  const handleTakeLoan = async () => {
    if (loanAmount <= 0) {
      return;
    }
    await onTakeLoan(loanAmount);
    setLoanAmount(0);
    onClose();
  };

  const handleClose = () => {
    setLoanAmount(0);
    onClose();
  };

  const effectiveMaxLoan = Math.min(maxLoanAmount, fundWallet);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6" fontWeight={600}>
          Take Loan
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2, pb: 1 }}>
          {/* Available Limits Info */}
          <Box
            sx={{
              mb: 3,
              p: 2,
              bgcolor: "grey.50",
              borderRadius: 2,
              border: "1px solid",
              borderColor: "grey.200",
            }}
          >
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="body2" color="text.secondary">
                Max Loan Amount:
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                ₹{maxLoanAmount.toLocaleString()}
              </Typography>
            </Box>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Fund Wallet:
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                ₹{fundWallet.toLocaleString()}
              </Typography>
            </Box>
          </Box>

          {/* Loan Amount Input */}
          <Typography variant="body2" color="text.secondary" mb={1}>
            Enter Loan Amount
          </Typography>
          <TextField
            fullWidth
            type="number"
            value={loanAmount || ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const val = Number(e.target.value);
              setLoanAmount(val > effectiveMaxLoan ? effectiveMaxLoan : val);
            }}
            placeholder="Ex: 10000"
            inputProps={{ min: 0, max: effectiveMaxLoan }}
            sx={{ mb: 2 }}
          />

          {/* Slider */}
          <Slider
            value={loanAmount}
            onChange={(_: Event, val: number | number[]) =>
              setLoanAmount(val as number)
            }
            min={0}
            max={effectiveMaxLoan}
            step={100}
            sx={{ mb: 3 }}
          />

          {/* Loan Summary */}
          {loanAmount > 0 && (
            <Box
              sx={{
                p: 2,
                bgcolor: "indigo.50",
                borderRadius: 2,
                border: "1px solid",
                borderColor: "indigo.100",
              }}
            >
              <Typography
                variant="subtitle2"
                fontWeight={700}
                color="text.primary"
                mb={1.5}
              >
                Monthly Repayment Details
              </Typography>

              <Box display="flex" justifyContent="space-between" mb={0.5}>
                <Typography variant="body2" color="text.secondary">
                  Principal:
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  ₹{loanAmount.toLocaleString()}
                </Typography>
              </Box>

              <Box display="flex" justifyContent="space-between" mb={0.5}>
                <Typography variant="body2" color="text.secondary">
                  Interest ({interestRate}%):
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight={500}
                  color="warning.main"
                >
                  + ₹{interest.toFixed(2)}
                </Typography>
              </Box>

              <Box display="flex" justifyContent="space-between" mb={0.5}>
                <Typography variant="body2" color="text.secondary">
                  Repayment ({loanRepaymentPercent}%):
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight={500}
                  color="success.main"
                >
                  + ₹{repayment.toFixed(2)}
                </Typography>
              </Box>

              <Box
                sx={{
                  mt: 1.5,
                  pt: 1.5,
                  borderTop: "1px solid",
                  borderColor: "indigo.200",
                }}
              >
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" fontWeight={700}>
                    Monthly EMI:
                  </Typography>
                  <Typography variant="h6" fontWeight={700} color="primary">
                    ₹{monthlyEMI.toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleTakeLoan}
          disabled={isLoading || loanAmount <= 0}
          startIcon={isLoading ? <CircularProgress size={16} /> : null}
        >
          {isLoading ? "Processing..." : "Take Loan"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
