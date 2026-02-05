import api from "@/lib/axios";

export const createMembership = async (data: any) => {
  const res = await api.post("/venture/membership", data);
  return res.data.data;
};


