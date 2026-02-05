import React, { useEffect, useState } from "react";
import { CircularProgress } from "@mui/material";
import toast from "react-hot-toast";
import { useRepayLoan, useGetLoanBalance } from "@/hooks/loan/useLoan";

interface EmiPopupProps {
  isOpen: boolean;
  onClose: () => void;
  loanData: any;
}

const EmiPopup: React.FC<EmiPopupProps> = ({ isOpen, onClose, loanData }) => {
  const [isVisible, setIsVisible] = useState(false);
  const { mutateAsync: repayLoan, isPending } = useRepayLoan();
  const { data: balanceData } = useGetLoanBalance(loanData?._id);

  // State for user input
  const [principalAmount, setPrincipalAmount] = useState<string>("");

  // Derived values
  const totalLoanAmount = loanData?.principal || 0;
  const interestRate = loanData?.interest_rate || 0;
  const months = loanData?.months || 1;
  const remainingPrincipal =
    balanceData?.data?.remaining_principal ?? totalLoanAmount;
  const interestPaidThisMonth =
    balanceData?.data?.interest_paid_this_month ?? false;

  // Monthly Calculations (Flat Rate assumption based on previous code)
  const baseMonthlyPrincipal = totalLoanAmount / months;
  const baseInterest = (totalLoanAmount * (interestRate / 100)) / months;
  const simpleMonthlyInterest = interestPaidThisMonth ? 0 : baseInterest;
  // Actually usually flat rate interest is on full amount, reducing balance interest is different.
  // Assuming flat rate as per previous code: (totalLoanAmount * rate) / months.
  // BUT the user asked to see "unpaid amount".

  // Let's stick to the previous simple interest logic for the monthly payment suggestion

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Initialize input with base monthly principal (rounded up to be safe)
      // Check if remaining principal is less than base monthly (last installment)
      const suggestedPrincipal = Math.min(
        Math.ceil(baseMonthlyPrincipal),
        Math.ceil(remainingPrincipal),
      );
      setPrincipalAmount(suggestedPrincipal.toString());
    } else {
      const timer = setTimeout(() => setIsVisible(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen, baseMonthlyPrincipal, remainingPrincipal]);

  if (!isVisible && !isOpen) return null;

  // Calculate totals for display
  const currentPrincipal = parseFloat(principalAmount) || 0;
  const totalPayable = currentPrincipal + simpleMonthlyInterest;

  const handlePay = async () => {
    if (currentPrincipal <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    // Allow paying less if it matches remaining? No, usually enforce minimum unless it's last payment.
    if (
      currentPrincipal < Math.floor(baseMonthlyPrincipal) &&
      currentPrincipal < remainingPrincipal
    ) {
      toast.error("Principal amount is less than the minimum required amount");
      return;
    }

    if (currentPrincipal > remainingPrincipal + 1) {
      // Tolerance
      toast.error(
        `Amount exceeds remaining principal of ₹${remainingPrincipal}`,
      );
      return;
    }

    try {
      const res = await repayLoan({
        loan_id: loanData._id,
        amount: totalPayable,
        principal_amount: currentPrincipal,
        interest_amount: simpleMonthlyInterest,
        payment_method: "WALLET",
      });

      if (res.success) {
        toast.success(res.message);
        onClose();
      } else {
        toast.error(res.message);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Payment failed");
    }
  };

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-end sm:items-center justify-center sm:p-6 transition-all duration-300 ${
        isOpen
          ? "bg-black/50 backdrop-blur-sm opacity-100"
          : "bg-black/0 opacity-0"
      }`}
      onClick={onClose}
    >
      <div
        className={`w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden transform transition-all duration-300 ${
          isOpen
            ? "translate-y-0 opacity-100 scale-100"
            : "translate-y-8 opacity-0 scale-95"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h3 className="text-lg font-bold text-gray-800">Confirm Payment</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* content */}
        <div className="p-6">
          {/* Balance Info */}
          <div className="flex justify-between items-center mb-6 bg-blue-50 p-3 rounded-lg border border-blue-100">
            <div>
              <p className="text-xs text-blue-600 font-medium uppercase">
                Remaining Principal
              </p>
              <p className="text-lg font-bold text-blue-900">
                ₹{remainingPrincipal.toLocaleString("en-IN")}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 font-medium uppercase">
                Total Paid
              </p>
              <p className="text-lg font-bold text-gray-700">
                ₹
                {balanceData?.data?.total_paid_principal?.toLocaleString(
                  "en-IN",
                ) ?? 0}
              </p>
            </div>
          </div>

          <div className="text-center mb-6">
            <span className="text-gray-500 text-sm font-medium uppercase tracking-wide">
              Total Payable Amount
            </span>
            <div className="flex items-center justify-center gap-1 mt-2">
              <span className="text-2xl text-gray-400 font-semibold">₹</span>
              <span className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight">
                {totalPayable.toLocaleString("en-IN", {
                  maximumFractionDigits: 0,
                })}
              </span>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            {/* Principal Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Principal Amount{" "}
                <span className="text-xs text-amber-600 font-normal">
                  (Min: ₹
                  {Math.min(
                    Math.ceil(baseMonthlyPrincipal),
                    Math.ceil(remainingPrincipal),
                  )}
                  )
                </span>
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">₹</span>
                </div>
                <input
                  type="number"
                  value={principalAmount}
                  onChange={(e) => setPrincipalAmount(e.target.value)}
                  className="block w-full pl-7 pr-12 py-3 sm:text-sm border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white"
                  placeholder="0.00"
                  min={1}
                  max={remainingPrincipal}
                />
              </div>
            </div>

            {/* Interest Input (Read Only) */}
            <div>
              <label className="flex justify-between items-center text-sm font-medium text-gray-700 mb-1">
                <span>
                  Interest Amount{" "}
                  <span className="text-xs text-gray-400 font-normal">
                    ({interestRate}% p.a.)
                  </span>
                </span>
                {interestPaidThisMonth && (
                  <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-medium border border-emerald-100">
                    Paid for{" "}
                    {new Date().toLocaleString("default", { month: "long" })}
                  </span>
                )}
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3  flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm ">₹</span>
                </div>
                <input
                  type="text"
                  value={simpleMonthlyInterest.toFixed(0)}
                  readOnly
                  className={`block w-full pl-7 pr-12 py-3 sm:text-sm border-gray-200 rounded-xl bg-gray-50 text-gray-500 focus:ring-0 focus:border-gray-200 cursor-not-allowed ${interestPaidThisMonth ? "line-through opacity-70" : ""}`}
                />
              </div>
            </div>
          </div>

          <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 mb-6 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-indigo-900">
                  Wallet Balance
                </span>
                <span className="text-[10px] text-indigo-700">
                  Available: ₹8,420
                </span>
              </div>
            </div>
            <button className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
              Top up
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onClose}
              className="py-3 px-4 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 active:bg-gray-100 transition-colors text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              onClick={handlePay}
              disabled={isPending || currentPrincipal <= 0}
              className="py-3 px-4 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 active:bg-indigo-800 shadow-sm shadow-indigo-200 transition-all flex items-center justify-center gap-2 text-sm sm:text-base disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <>
                  <CircularProgress size={18} color="inherit" thickness={5} />
                  <span>Processing</span>
                </>
              ) : (
                "Pay Now"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmiPopup;
