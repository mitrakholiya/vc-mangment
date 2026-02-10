import api from "@/lib/axios";
import { useMutation } from "@tanstack/react-query";

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
