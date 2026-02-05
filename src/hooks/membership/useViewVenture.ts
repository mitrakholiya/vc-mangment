


import { useQuery } from "@tanstack/react-query";
import { viewVenture } from "./getVenture";

export const useViewVentureQuery = () => {
    return useQuery({
        queryKey: ["viewVenture"],
        queryFn: viewVenture,
    });
};
