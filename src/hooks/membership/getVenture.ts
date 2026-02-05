import api from "@/lib/axios";

export const viewVenture = async () => {
    const res = await api.get(`/venture/view-venture`);
    return res.data.data;
};
