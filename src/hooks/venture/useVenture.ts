import api from "@/lib/axios";

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


