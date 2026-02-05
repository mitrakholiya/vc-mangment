import api from "@/lib/axios";
import { useMutation, useQuery } from "@tanstack/react-query";

// Types
export interface ContributionData {
  _id: string;
  vc_id: {
    _id: string;
    name: string;
    monthly_contribution: number;
  };
  user_id: string;
  amount: number;
  month: number;
  year: number;
  status: "PAID" | "PENDING";
  paid_at?: string;
}

export interface GetContributionsResponse {
  success: boolean;
  data: ContributionData[];
}

// API Functions
export const addContribution = async (vc_id: string) => {
  const res = await api.put("/venture/add-contribution", { vc_id });
  return res.data;
};

export const getContributions = async (
  vc_id?: string,
): Promise<GetContributionsResponse> => {
  const params = vc_id ? `?vc_id=${vc_id}` : "";
  const res = await api.get(`/venture/add-contribution${params}`);
  return res.data;
};

// Hooks
const useAddcontribution = (vc_id: string) => {


  return useMutation({
    mutationFn: () => addContribution(vc_id),
  });
};

export const useGetContributions = (vc_id?: string) => {
  return useQuery({
    queryKey: ["contributions", vc_id],
    queryFn: () => getContributions(vc_id),
  });
};

export default useAddcontribution;
