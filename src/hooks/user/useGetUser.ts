import { useQuery } from "@tanstack/react-query";
import { getUser } from "./useUser";

export const useGetUser = () => {
  return useQuery({
    queryKey: ["User"],
    queryFn: getUser,
  });
};
