import api from "@/lib/axios";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  getLoansByVentureId,
  getLoanByUserIdAndVentureId,
  postLoanByUserIdAndVentureId,
  repayLoan,
  getLoanBalance,
} from "../loan-hooks/loan.services";

interface LoanRequest {
  vc_id: string;
  principal: number;
  months: number;
}

export const createLoanRequest = async (data: LoanRequest) => {
  const res = await api.post("/venture/loan", data);
  return res.data;
};

export const updateLoanStatus = async (data: {
  loanId: string;
  approve_status: string;
}) => {
  const res = await api.put("/venture/loan", data);
  return res.data;
};

// User requests for loan
export const useCreateLoan = () => {
  return useMutation({
    mutationFn: createLoanRequest,
  });
};

// Admin updates loan status
export const useUpdateLoanStatus = () => {
  return useMutation({
    mutationFn: updateLoanStatus,
  });
};

// Admin gets loans by venture id
export const useGetLoansByVentureId = (vc_id: string) => {
  return useQuery({
    queryKey: ["loans", vc_id],
    queryFn: () => getLoansByVentureId(vc_id),
    enabled: !!vc_id, // Only fetch when vc_id is available
  });
};

export const useGetLoanByUserIdAndVentureId = (vc_id: string) => {
  return useQuery({
    queryKey: ["user loan with vc_id", vc_id],
    queryFn: () => getLoanByUserIdAndVentureId(vc_id),
    enabled: !!vc_id, // Only fetch when vc_id is available
  });
};

// export const usePostLoanByUserIdAndVentureId = (vc_id: string, data: any) => {
//   return useMutation({
//     mutationFn: () => postLoanByUserIdAndVentureId(vc_id, data),
//   });
// };

export const useRepayLoan = () => {
  return useMutation({
    mutationFn: repayLoan,
  });
};

export const useGetLoanBalance = (loan_id: string) => {
  return useQuery({
    queryKey: ["loan balance", loan_id],
    queryFn: () => getLoanBalance(loan_id),
    enabled: !!loan_id,
  });
};
