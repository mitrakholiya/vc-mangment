import api from "@/lib/axios";

export const getMember = async () => {
    const res = await api.get("/member");
    return res.data.data;
};

export const addMember = async (data: any) => {
    const res = await api.post("/member", data);
    return res.data.data;
};