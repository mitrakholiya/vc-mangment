"use client";
import React from "react";
import { useViewVentureQuery } from "@/hooks/membership/useViewVenture";
import PlanCard from "@/components/PlanCard";

const page = () => {
  const { data, isLoading, isError, error } = useViewVentureQuery();

  if (isLoading) return <p>Loading...</p>;
  if (isError) return <p>{error.message}</p>;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-4">
      <h1 className="text-xl sm:text-2xl font-bold text-center my-4 sm:my-6">
        View Venture
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {data?.map((item: any) => (
          <PlanCard key={item._id} data={item} view="view" />
        ))}
      </div>
      {/* <pre>{JSON.stringify(data, null, 2)}</pre> */}
    </div>
  );
};

export default page;
