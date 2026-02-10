"use client";
import { CircularProgress, Fab } from "@mui/material";
import Lottie from "lottie-react";
import Link from "next/link";
import animationData from "../../../../public/animation/MVCTEST.json";
import { useState } from "react";
import { useViewVentureQuery } from "@/hooks/membership/useViewVenture";

type Venture = {
  _id: string;
  name: string;
  monthly_emi: number; // Was monthly_contribution
  interest_rate: number; // Was loan_interest_percent
  start_date: Date;
  collection_date: number; // Monthly occurrence date (1-31)
  max_loan_amount: number; // Was max_loan_percent, now fixed amount
  loan_repayment_percent: number; // Fixed Monthly Loan Repayment percentage
  members: string[]; // Array of strings (User IDs)
  requests: string[]; // Array of strings (Request IDs or User IDs?)

  // System fields kept for compatibility/logic
  created_at: Date;
  updated_at: Date;
  created_by: string;
  fund_wallet: number;
  status: string;
};

const Page = () => {
  const [popup, setPopup] = useState<boolean>(false);

  const { data: venture, isLoading, isError, error } = useViewVentureQuery();

  if (isLoading) {
    return (
      <div className="flex-1 flex justify-center items-center w-full">
        <CircularProgress />
      </div>
    );
  }
  if (isError) {
    return (
      <div className="flex-1 flex justify-center items-center w-full">
        <p>{error.message}</p>
      </div>
    );
  }

  return (
    <div className="w-full  mx-auto bg-background py-[20px]">
      {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ventureData?.map((item: Venture) => (
          <PlanCard key={item._id} data={item} isAdmin={true} />
        ))}
      </div> */}
      <div className=" max-w-5xl mx-auto">
        <div className="grid grid-cols-2 gap-3 px-[10px]">
          {/* Venture */}
          {venture.map((v: Venture) => (
            <Link
              key={v._id}
              href={`/view-venture/${v._id}`}
              className="flex flex-col items-center bg-black/10 border-[1px] border-gray-900/60 rounded-2xl"
            >
              <Lottie
                animationData={animationData}
                loop={true}
                className="w-50 h-30"
              />
              <p className=" uppercase  w-full text-secondary text-[19px] pb-2 font-semibold rounded-2xl text-center">
                {v.name}
              </p>
            </Link>
          ))}
        </div>
        {/* For Big Screen */}
        <div className="hidden sm:grid grid-cols-2 h-full justify-center items-center my-[20px] gap-3 ">
          <Link href="/join">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-lg ">
              <span className="font-medium text-gray-700">Join Venture</span>
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
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
                    d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                  />
                </svg>
              </div>
            </div>
          </Link>
          <Link href="/venture">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-lg">
              <span className="font-medium text-gray-700">Create Venture</span>
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
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
            </div>
          </Link>
        </div>
        <div className="sm:hidden">
          {/* Overlay - visible when popup is true */}
          {popup && (
            <div
              className="fixed inset-0 bg-black/50 z-[999] backdrop-blur-sm transition-all duration-300"
              onClick={() => setPopup(false)}
            />
          )}

          {/* Options */}
          <div
            className={`fixed bottom-[90px] right-6 flex flex-col items-end gap-3 z-[1000] transition-all duration-300 ${
              popup
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4 pointer-events-none"
            }`}
          >
            <Link href="/join">
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-lg">
                <span className="font-medium text-gray-700">Join Venture</span>
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
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
                      d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                    />
                  </svg>
                </div>
              </div>
            </Link>

            <Link href="/venture">
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-lg">
                <span className="font-medium text-gray-700">
                  Create Venture
                </span>
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
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
              </div>
            </Link>
          </div>

          {/* Main FAB */}
          <Fab
            color="primary"
            aria-label="add"
            sx={{
              position: "fixed",
              bottom: 24,
              right: 24,
              zIndex: 1000,
              transform: popup ? "rotate(45deg)" : "rotate(0deg)",
              transition: "transform 0.3s ease",
            }}
            onClick={() => setPopup(!popup)}
          >
            <span className="text-3xl font-light">+</span>
          </Fab>
        </div>
      </div>
    </div>
  );
};

export default Page;
