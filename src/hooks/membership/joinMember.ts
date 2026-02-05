import api from "@/lib/axios";

export const joinVc = async (id: any) => {
    console.log("id",id);
    
    const res = await api.get(`/venture/join/${id}`);
    return res.data.data;
};


