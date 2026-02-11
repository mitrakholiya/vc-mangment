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
  status: "paid" | "pending" | "none" | "approved";
  paid_at?: string;
}

export interface GetContributionsResponse {
  success: boolean;
  data: ContributionData[];
}

// API Functions

const reqestTopanding = async (id: string) => {
  const res = await api.put("/venture/request-to-pending", { vc_id: id });
  return res.data;
};

const getReqestTopanding = async (vc_id: string) => {
  const res = await api.get("/venture/request-to-pending", {
    params: { vc_id },
  });
  return res.data;
};

// Admin Direct Approvel

// ---------------------------------------------------------------------

const putDirectApprove = async ({
  id,
  part_payment,
}: {
  id: string;
  part_payment?: number;
}) => {
  const res = await api.put("/admin/approve-contribution", {
    id,
    part_payment,
  });
  return res.data;
};

export const usePutDirectApprove = () => {
  return useMutation({
    mutationFn: (data: { id: string; part_payment?: number }) =>
      putDirectApprove(data),
  });
};

// Admin  Redo Part Payment
// ---------------------------------------------------------------------

const putRedoApprove = async (
  id:string) => {
  const res = await api.put("/admin/redo_approve", {
    id,
  });
  return res.data;
};

export const usePutRedoApprove = () => {
  return useMutation({
    mutationFn: (id: string) =>
      putRedoApprove(id),
  });
};


// ---------------------------------------------------------------------

// Admin Loan Distribution

const putLoanDistribution = async (loan: any, id: string) => {
  const res = await api.post("/admin/loan", { loan, vc_id: id });
  return res.data;
};

export const usePutLoanDistribution = () => {
  return useMutation({
    mutationFn: ({ loan, id }: { loan: any; id: string }) =>
      putLoanDistribution(loan, id),
  });
};

// ---------------------------------------------------------------------

const putLock = async (id: string) => {
  const res = await api.put("/admin/lock", { id });
  return res.data;
};

export const usePutLock = () => {
  return useMutation({
    mutationFn: (id: string) => putLock(id),
  });
};

// ---------------------------------------------------------------------
// ---------------------------------------------------------------------

const getVcMonthly = async (id: string) => {
  const res = await api.get(`/admin/vc-monthly`, {
    params: { vc_id: id },
  });
  return res.data;
};

export const useGetVcMonthly = (id: string) => {
  return useQuery({
    queryKey: ["get-vc-monthly", id],
    queryFn: () => getVcMonthly(id),
    enabled: !!id,
  });
};

export const useGetReqestTopanding = (vc_id: string) => {
  return useQuery({
    queryKey: ["reqest-to-pending", vc_id],
    queryFn: () => getReqestTopanding(vc_id),
  });
};

export const useRequestToPending = (id: string) => {
  return useMutation({
    mutationFn: () => reqestTopanding(id),
  });
};

const getNextMonthData = async (id: string) => {
  const res = await api.get(`/admin/next-month-data`, {
    params: { vc_id: id },
  });
  return res.data;
};

export const useGetNextMonthData = (id: string) => {
  return useQuery({
    queryKey: ["get-next-month-data", id],
    queryFn: () => getNextMonthData(id),
    enabled: !!id,
  });
};

const getVcHistory = async (id: string) => {
  const res = await api.get(`/admin/history`, {
    params: { vc_id: id },
  });
  return res.data;
};

export const useGetVcHistory = (id: string) => {
  return useQuery({
    queryKey: ["get-vc-history", id],
    queryFn: () => getVcHistory(id),
    enabled: !!id,
  });
};
