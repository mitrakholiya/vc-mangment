import api from "@/lib/axios";

export const joinVc = async (id: any) => {
  console.log("id", id);

  try {
    const res = await api.get(`/venture/join/${id}`);
    return res.data;
  } catch (error: any) {
    return (
          error.response?.data || {
        success: false,
        message: error.message || "An error occurred",
      }
    );
  }
};
