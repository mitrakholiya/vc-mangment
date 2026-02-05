import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addMember } from "./member";

export const useMemberAddMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addMember,
    onSuccess: () => {
      // Invalidate or refetch members list after adding a member
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
  });
};
