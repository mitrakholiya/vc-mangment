import React from "react";
import {
  useGetVcMonthly,
  usePutDirectApprove,
  usePutLoanDistribution,
} from "@/hooks/contribution/useContribution";
import MemberTableUI from "./MemberTableUI";
import { CircularProgress, Typography } from "@mui/material";

const MemberTable = ({ id }: { id: string }) => {
  const { data, isLoading, refetch, isError, error } = useGetVcMonthly(id);
  const { mutateAsync } = usePutDirectApprove();
  const { mutateAsync: loanDistribution } = usePutLoanDistribution();

  const handleApprove = async (recordId: string, partPayment: number) => {
    return await mutateAsync({ id: recordId, part_payment: partPayment });
  };

  const handleAddLoan = async (loanWrapper: { loan: any }) => {
    // loanWrapper matches what UI sends: { loan: manualLoanMap }
    return await loanDistribution({ loan: loanWrapper.loan, id });
  };

  const userVcMonthlyData = data?.data?.user_vc_monthly || [];

  const getMonthName = (month: number) => {
    const date = new Date();
    date.setMonth(month - 1);
    return date.toLocaleString("default", { month: "long" });
  };

  const firstRecord = userVcMonthlyData[0];
  const monthName = firstRecord ? getMonthName(firstRecord.month) : "";
  const year = firstRecord ? firstRecord.year : new Date().getFullYear();

  return (
    <MemberTableUI
      userVcMonthlyData={userVcMonthlyData}
      isLoading={isLoading}
      isError={isError}
      error={error}
      refetch={refetch}
      onApprove={handleApprove}
      onAddLoan={handleAddLoan}
      monthName={monthName}
      year={year}
    />
  );
};

export default MemberTable;
