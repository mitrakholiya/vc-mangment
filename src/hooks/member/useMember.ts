


import { useQuery } from "@tanstack/react-query";
import { getMember } from "./member";

export const useMembersQuery = () => {
  return useQuery({
    queryKey: ["members"],
    queryFn: getMember,
  });
};
