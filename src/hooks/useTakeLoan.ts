import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

interface TakeLoanRequest {
  vc_id: string;
  loan_amount: number;
}

interface TakeLoanResponse {
  success: boolean;
  message: string;
  data?: {
    loan_amount: number;
    remaining_loan: number;
    venture_fund_wallet: number;
  };
}

// Take loan function
export const takeLoan = async (
  data: TakeLoanRequest,
): Promise<TakeLoanResponse> => {
  const response = await axios.post<TakeLoanResponse>(
    "/api/venture/take-loan",
    data,
  );
  return response.data;
};

// React hook for taking loan
export const useTakeLoan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: takeLoan,
    onSuccess: () => {
      // ⚡ Auto-refetch after taking loan
      queryClient.invalidateQueries({ queryKey: ["get-vc-monthly"] });
      queryClient.invalidateQueries({ queryKey: ["get-next-month-data"] });
      queryClient.invalidateQueries({ queryKey: ["venture-by-id"] });
      queryClient.invalidateQueries({ queryKey: ["reqest-to-pending"] });
    },
  });
};
