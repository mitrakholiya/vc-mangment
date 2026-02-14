import api from "@/lib/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateVentureStatus,
    onSuccess: () => {
      // ⚡ Auto-refetch after status update
      queryClient.invalidateQueries({ queryKey: ["venture-by-id"] });
      queryClient.invalidateQueries({ queryKey: ["ventures"] });
    },
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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: manageVentureRequest,
    onSuccess: () => {
      // ⚡ Auto-refetch after accepting/rejecting request
      queryClient.invalidateQueries({ queryKey: ["venture-by-id"] });
      queryClient.invalidateQueries({ queryKey: ["ventures"] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: repayExitingDues,
    onSuccess: () => {
      // ⚡ Auto-refetch after repaying exiting dues
      queryClient.invalidateQueries({ queryKey: ["exiting-dues"] });
      queryClient.invalidateQueries({ queryKey: ["venture-by-id"] });
      queryClient.invalidateQueries({ queryKey: ["get-vc-history"] });
    },
  });
};

export const getExitingDues = async (vc_id: string) => {
  const res = await api.get(`/venture/repay-exiting-dues`, {
    params: { vc_id },
  });
  return res.data.data;
};

export const useGetExitingDues = (vc_id: string) => {
  return useQuery({
    queryKey: ["exiting-dues", vc_id],
    queryFn: () => getExitingDues(vc_id),
    enabled: !!vc_id,
  });
};
