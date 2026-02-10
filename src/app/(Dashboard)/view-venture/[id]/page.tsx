"use client";
import React, { useState } from "react";
import { useParams } from "next/navigation";
import {
  useUserVcMonthlyById,
  useViewVentureQuery,
} from "@/hooks/membership/useViewVenture";
import PlanCard from "@/components/PlanCard";
import { CircularProgress } from "@mui/material";
import { useGetUser } from "@/hooks/user/useGetUser";
import ViewVentureComponent from "@/components/ViewVentureComponent";
// import ReqOfPanding from "@/components/admin/ReqOfPanding";
import MemberTable from "@/components/admin/MemberTable";

const page = () => {
  const [active, setActive] = useState<boolean>(true);
  const params = useParams();
  const vc_id: string = Array.isArray(params?.id)
    ? params.id[0]
    : (params?.id ?? "");
  const { data: user } = useGetUser();
  const userId = user?.userId; // Adjust this based on actual API response structure (e.g., user?._id or user?.id)
// Admin
  const { data, isLoading, isError, error } = useViewVentureQuery();

  const {
    data: userVcMonthlyData,
    isLoading: userVcMonthlyLoading,
    isError: userVcMonthlyIsError,
    error: userVcMonthlyError,
  } = useUserVcMonthlyById(vc_id);

  if (!isLoading) {
    console.log(userVcMonthlyData);
    console.log(data);
  }

  const filteredData = data?.filter((item: any) => item._id === vc_id);

  const isAdmin: boolean = (userVcMonthlyData as any)?.isAdmin;

  console.log(isAdmin);

  if (isLoading) {
    return (
      <div className="flex-1 flex justify-center items-center w-full">
        <CircularProgress />
      </div>
    );
  }
  if (isError) {
    return (
      <div className="flex-1 flex justify-center items-center w-full">
        <p>{error.message}</p>
      </div>
    );
  }

  return (
    <div className=" sm:px-6 lg:px-8 py-4 max-w-5xl mx-auto">
      {isAdmin && (
        <div className="grid grid-cols-2 gap-2 mb-[20px] px-[10px]">
          <button
            onClick={() => setActive(true)}
            className={` text-white py-1 px-4 text-sm  rounded-lg flex items-center gap-2 ${active ? "bg-secondary/50" : "bg-secondary"}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            View Venture
          </button>
          <button
            onClick={() => setActive(false)}
            className={`text-white py-1 px-4 text-sm  rounded-lg flex items-center  gap-2 ${active ? "bg-secondary" : "bg-secondary/50"}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75"
              />
            </svg>
            {filteredData?.[0]?.name}
          </button>
        </div>
      )}

      {active && <ViewVentureComponent data={userVcMonthlyData as any} />}
      {/* {isAdmin && active && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredData?.map((item: any) => (
            <PlanCard
              key={item._id}
              data={item}
              view="view"
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )} */}

      {/* For Admin */}
      {!active && (
        <div className="border-1px">
          {/* <ReqOfPanding /> */}
          <MemberTable id={vc_id} />
        </div>
      )}

      {/* {!isAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredData?.map((item: any) => (
            <PlanCard
              key={item._id}
              data={item}
              view="view"
              isAdmin={isAdmin}
            />
          ))}


        </div>
      )} */}

      {/* <pre>{JSON.stringify(data, null, 2)}</pre> */}
    </div>
  );
};

export default page;
