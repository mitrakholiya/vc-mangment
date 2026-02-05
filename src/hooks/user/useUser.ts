import api from "../../lib/axios"

export const getUser = async () => {
    const res = await api.get("/getuser")
    return res.data.data
}
