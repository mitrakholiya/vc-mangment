"use client";
import React, { useEffect, useState } from "react";
import { Input } from "@/components/Input";
// import { IMember } from "@/models/venture.model";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import axios from "axios";
import { createVenture } from "@/hooks/venture/useVenture";
import { createMembership } from "@/hooks/membership/membership";

const Page: React.FC = () => {
  const router = useRouter();

  const [vc, setVc] = useState({
    name: "",
    monthly_emi: "", // Was monthly_contribution
    interest_rate: "", // Was loan_interest_percent
    max_loan_amount: "", // Was max_loan_percent
    start_date: "", // New
    collection_date: "", // New (Day of month 1-31)
    loan_repayment_percent: "", // New
    created_by: "",
  });

  useEffect(() => {
    const getUser = async () => {
      const res = await axios.get("/api/getuser");
      if (res.data.success) {
        setVc((prev) => ({
          ...prev,
          created_by: res.data.data.userId,
        }));
      }
    };
    getUser();
  }, []);

  // SUBMIT (final object)
  const submitHandler = async () => {
    // Basic validation
    if (
      !vc.name ||
      !vc.monthly_emi ||
      !vc.interest_rate ||
      !vc.max_loan_amount ||
      !vc.start_date ||
      !vc.collection_date ||
      !vc.loan_repayment_percent
    ) {
      toast.error("Please fill all fields");
      return;
    }

    const payload = {
      ...vc,
      name: String(vc.name),
      monthly_emi: Number(vc.monthly_emi),
      interest_rate: Number(vc.interest_rate),
      max_loan_amount: Number(vc.max_loan_amount),
      start_date: vc.start_date, // Date string is fine usually, backend converts
      collection_date: Number(vc.collection_date),
      loan_repayment_percent: Number(vc.loan_repayment_percent),
    };

    const response = await createVenture(payload);

    if (response?.success) {
      toast.success("Venture Created Successfully");


      // const res = await createMembership({
      //   vc_id: response.data._id,
      //   role: "ADMIN",
      // });

      // if (res?.success) {
      //   toast.success(res?.message);
      // }

      setVc({
        name: "",
        monthly_emi: "",
        interest_rate: "",
        max_loan_amount: "",
        start_date: "",
        collection_date: "",
        loan_repayment_percent: "",
        created_by: "",
      });
      router.push("/profile");
    } else {
      toast.error(response?.message || "Failed to create venture");
    }
  };

  return (
    <div className="min-h-screen text-black sm:p-4 bg-background">
      <div className=" bg-background sm:bg-white w-full rounded-lg p-2 space-y-4 max-w-2xl mx-auto">
        <h2 className="text-2xl font-extrabold! font-secondary text-primary  border-b pb-2 pt-2">
          Create New Venture
        </h2>

        {/* Name */}
        <div className="space-y-4 ">
          <div>
            <Input
              type="text"
              placeholder="Venture Name"
             
              value={vc.name}
              setValue={(val) => setVc({ ...vc, name: val })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                type="number"
                placeholder="Monthly EMI Amount"
                value={vc.monthly_emi}
                setValue={(val) => setVc({ ...vc, monthly_emi: val })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                type="number"
                placeholder="Interest Rate (%)"
                value={vc.interest_rate}
                setValue={(val) => setVc({ ...vc, interest_rate: val })}
              />
            </div>
            <div>
              <Input
                type="number"
                placeholder="Max Loan Amount"
                value={vc.max_loan_amount}
                setValue={(val) => setVc({ ...vc, max_loan_amount: val })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Start Date
              </label>
              <Input
                type="date"
                placeholder=""
                value={vc.start_date}
                setValue={(val) => setVc({ ...vc, start_date: val })}
              />
            </div>
            <div>
              <Input
                type="number"
                placeholder="monthly occurance date"
                // placeholder="Collection Date (Day 1-31)"
                value={vc.collection_date}
                setValue={(val) => setVc({ ...vc, collection_date: val })}
              />
            </div>
          </div>

          <div>
            <Input
              type="number"
              placeholder="Fixed Monthly Loan Repayment (%)"
              value={vc.loan_repayment_percent}
              setValue={(val) => setVc({ ...vc, loan_repayment_percent: val })}
            />
            <p className="text-xs text-gray-500 mt-1">
              Percentage of principal to be repaid monthly
            </p>
          </div>
        </div>

        {/* SUBMIT */}
        <div className="pt-4">
          <button
            onClick={submitHandler}
            className="w-full bg-primary hover:bg-primary/80 transition-colors text-white py-3 rounded-lg font-semibold"
          >
            Create Venture
          </button>
        </div>
      </div>
    </div>
  );
};

export default Page;

// Force TS update
