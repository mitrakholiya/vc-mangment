import api from "@/lib/axios";
import { useMutation, useQuery } from "@tanstack/react-query";

export const getVenture = async () => {
  const res = await api.get("/venture");
  return res.data.data;
};

export const getVentureById = async (id: string) => {
  const res = await api.get(`/venture/${id}`);
  return res.data.data;
};

export const createVenture = async (data: any) => {
  const res = await api.post("/venture", data);
  return res.data;
};

export const updateVentureStatus = async (data: {
  vc_id: string;
  status: "active" | "inactive";
}) => {
  const res = await api.put(`/venture/${data.vc_id}`, data);
  return res.data;
};

export const useUpdateVentureStatus = () => {
  return useMutation({
    mutationFn: updateVentureStatus,
  });
};

export const manageVentureRequest = async (data: {
  vc_id: string;
  user_id: string;
  action: "accept" | "reject";
}) => {
  const res = await api.post("/venture/request/action", data);
  return res.data;
};

export const useManageVentureRequest = () => {
  return useMutation({
    mutationFn: manageVentureRequest,
  });
};


// ------------------------------------------------------------------------------
// Exite member repayment
// ------------------------------------------------------------------------------

export const repayExitingDues = async (data: {
  vc_id: string;
  user_id: string;
  paidAmount: number;
}) => {
  const res = await api.post("/venture/repay-exiting-dues", data);
  return res.data;
};

export const useRepayExitingDues = () => {
  return useMutation({
    mutationFn: repayExitingDues,
  });
};

export const getExitingDues = async (vc_id: string) => {
  const res = await api.get(`/venture/repay-exiting-dues`,{params:{vc_id}});
  return res.data.data;
};

export const useGetExitingDues = (vc_id: string) => {
  return useQuery({
    queryKey: ["exiting-dues", vc_id],
    queryFn: () => getExitingDues(vc_id),
    enabled: !!vc_id,
  });
};
