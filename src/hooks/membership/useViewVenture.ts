import { useQuery } from "@tanstack/react-query";
import { viewVenture, viewUserVcMonthlyById } from "./getVenture";

export const useViewVentureQuery = () => {
  return useQuery({
    queryKey: ["viewVenture"],
    queryFn: viewVenture,
  });
};

export const useUserVcMonthlyById = (id: string) => {
  return useQuery({
    queryKey: ["viewVentureById", id],
    queryFn: () => viewUserVcMonthlyById(id),

    enabled: !!id,
    staleTime: 0,
    gcTime: 0,
  });
};
