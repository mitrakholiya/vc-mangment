import { useQuery } from "@tanstack/react-query";
import { getVentureById  } from "./useVenture";

export const useGetVentureById = (id: string | null) => {
  return useQuery({
    queryKey: ["venture", id],
    queryFn: () => getVentureById(id!),
    enabled: !!id, // Only run query if id exists
  });
};


