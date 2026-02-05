import { Chip, CircularProgress, Typography } from "@mui/material";
import React, { useState } from "react";
import EmiPopup from "./EmiPopup";

const UserPersonalLoan = ({
  loanData,
  isLoadingLoans,
}: {
  loanData: any;
  isLoadingLoans: boolean;
}) => {
  const [isEmiPopupOpen, setIsEmiPopupOpen] = useState(false);

  const handlePayEmi = () => {
    try {
      setIsEmiPopupOpen(true);
    } catch (error) {}
  };

  return (
    <div>
      <div className="space-y-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
            <svg
              className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <Typography
            variant="subtitle2"
            fontWeight={600}
            className="text-gray-800 text-sm sm:text-base"
          >
            My Loan Status
          </Typography>
        </div>

        {isLoadingLoans ? (
          <div className="flex justify-center py-6">
            <div className="relative">
              <CircularProgress size={32} className="text-indigo-500" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-4 h-4 bg-indigo-100 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        ) : loanData ? (
          <div className="relative overflow-hidden rounded-lg sm:rounded-xl bg-linear-to-br from-slate-50 via-white to-indigo-50 border border-indigo-100 shadow-sm">
            {/* Decorative Elements - Hidden on very small screens */}
            <div className="hidden xs:block absolute top-0 right-0 w-16 sm:w-20 h-16 sm:h-20 bg-linear-to-br from-indigo-200/30 to-purple-200/30 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="hidden xs:block absolute bottom-0 left-0 w-12 sm:w-16 h-12 sm:h-16 bg-linear-to-tr from-blue-200/20 to-indigo-200/20 rounded-full translate-y-1/2 -translate-x-1/2"></div>

            <div className="relative p-3 sm:p-4 space-y-3 sm:space-y-4">
              {/* Status Badges Row */}
              <div className="flex flex-wrap items-center gap-2">
                <Chip
                  label={loanData.approve_status}
                  size="small"
                  sx={{
                    fontWeight: 600,
                    fontSize: "0.7rem",
                    background:
                      loanData.approve_status === "APPROVED"
                        ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                        : loanData.approve_status === "PENDING"
                          ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                          : "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                    color: "white",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                  }}
                />
                <Chip
                  label={loanData.status}
                  size="small"
                  sx={{
                    fontWeight: 600,
                    fontSize: "0.7rem",
                    background:
                      loanData.status === "ACTIVE"
                        ? "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
                        : "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)",
                    color: "white",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                  }}
                />
              </div>

              {/* Principal Amount - Hero Display */}
              <div className="text-center py-2 sm:py-3">
                <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider mb-0.5 sm:mb-1">
                  Principal Amount
                </p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-xl xs:text-2xl sm:text-3xl font-bold bg-linear-to-r from-indigo-600 to-purple-600 text-white px-4 py-1 rounded-xl shadow-sm">
                    ₹{loanData.principal?.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Loan Details Grid */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {/* Interest Rate */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-2 sm:p-3 border border-gray-100 shadow-sm active:scale-[0.98] sm:hover:shadow-md transition-all">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                      <svg
                        className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                        />
                      </svg>
                    </div>
                    <span className="text-[10px] sm:text-xs text-gray-500 truncate">
                      Interest Rate
                    </span>
                  </div>
                  <p className="text-base sm:text-lg font-bold text-gray-800">
                    {loanData.interest_rate}%
                  </p>
                </div>

                {/* Duration */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-2 sm:p-3 border border-gray-100 shadow-sm active:scale-[0.98] sm:hover:shadow-md transition-all">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <svg
                        className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <span className="text-[10px] sm:text-xs text-gray-500 truncate">
                      Duration
                    </span>
                  </div>
                  <p className="text-base sm:text-lg font-bold text-gray-800">
                    {loanData.months}{" "}
                    <span className="text-xs sm:text-sm font-normal text-gray-500">
                      mo
                    </span>
                  </p>
                </div>
              </div>

              {/* EMI Calculation Display */}
              <div className="bg-linear-to-r from-indigo-500 to-purple-600 p-2 rounded-lg sm:p-3 text-white ">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1 px-2">
                    <p className="text-[10px] sm:text-xs  text-indigo-100 uppercase tracking-wider ">
                      Estimated EMI
                    </p>
                    <p className="text-lg sm:text-xl font-bold truncate">
                      ₹
                      {(
                        (loanData.principal *
                          (1 + loanData.interest_rate / 100)) /
                        loanData.months
                      )
                        .toFixed(0)
                        .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                      <span className="text-xs sm:text-sm font-normal text-indigo-100">
                        /mo
                      </span>
                    </p>
                  </div>

                  {/* Handel pay Emi */}
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <button
                      className="text-white bg-linear-to-r border-2 border-white from-indigo-500 to-purple-600 p-2 rounded-lg hover:scale-110 transition-transform focus:outline-none"
                      onClick={handlePayEmi}
                    >
                      Pay EMI
                    </button>
                  </div>
                </div>
              </div>

              {/* Loan Timeline */}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-gray-500 pt-2 border-t border-gray-100">
                {/* <svg
                    className="w-3 h-3 sm:w-4 sm:h-4 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg> */}

                <span className="whitespace-nowrap">
                  Created:{" "}
                  {new Date(loanData.created_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "2-digit",
                  })}
                </span>
                {loanData.closed_at && (
                  <>
                    <span className="text-gray-300 hidden xs:inline">|</span>
                    <span className="whitespace-nowrap">
                      Closed:{" "}
                      {new Date(loanData.closed_at).toLocaleDateString(
                        "en-IN",
                        { day: "numeric", month: "short", year: "2-digit" },
                      )}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-lg sm:rounded-xl bg-linear-to-br from-gray-50 to-gray-100 border border-gray-200 p-4 sm:p-6 text-center">
            <div className="absolute top-0 right-0 w-16 sm:w-24 h-16 sm:h-24 bg-gray-200/50 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="relative">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2 sm:mb-3 rounded-full bg-gray-200 flex items-center justify-center">
                {/* <svg
                  className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg> */}
              </div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">
                No Active Loan
              </p>
              <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1">
                Apply for a loan to get started
              </p>
            </div>
          </div>
        )}
      </div>
      <EmiPopup
        isOpen={isEmiPopupOpen}
        onClose={() => setIsEmiPopupOpen(false)}
        loanData={loanData}
      />
    </div>
  );
};

export default UserPersonalLoan;
