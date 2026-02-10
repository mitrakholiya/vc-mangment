import api from "@/lib/axios";

export const viewVenture = async () => {
    const res = await api.get(`/venture/view-venture`);
    return res.data.data;
};

export const viewUserVcMonthlyById = async (id: string) => {
    const res = await api.get(`/venture/view-user-vc-monthly/${id}`);
    return res.data.data;
};
