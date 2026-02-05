import api from "@/lib/axios";

export const getLoan = async (vc_id: string) => {
  const res = await api.post(`/loan/get-loan?vc_id=${vc_id}`);
  return res.data;
};

export const getLoansByVentureId = async (vc_id: string) => {
  const res = await api.get(`/venture/loan/${vc_id}`);
  return res.data;
};

// vc and user id
export const getLoanByUserIdAndVentureId = async (vc_id: string) => {
  const res = await api.get(`/venture/loan/user/${vc_id}`);
  return res.data;
};

// export const postLoanByUserIdAndVentureId = async (vc_id: string, data: any) => {
//   const res = await api.post(`/venture/loan/user/${vc_id}`, data);
//   return res.data;
// };

export const repayLoan = async (data: any) => {
  const res = await api.post(`/venture/loan/repay`, data);
  return res.data;
};

export const getLoanBalance = async (loan_id: string) => {
  const res = await api.get(`/venture/loan/balance?loan_id=${loan_id}`);
  return res.data;
};
