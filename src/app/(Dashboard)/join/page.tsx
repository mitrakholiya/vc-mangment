"use client";
import React, { useState } from "react";
import { Input } from "@/components/Input";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { joinVc } from "@/hooks/membership/joinMember";

const Page: React.FC = () => {
  const router = useRouter();
  const [joinId, setJoinId] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const handleJoin = async () => {
    if (!joinId) {
      toast.error("Please enter a Venture ID");
      return;
    }

    setIsJoining(true);
    const res = await joinVc(joinId);
    setIsJoining(false);

    if (res.success) {
      toast.success(res.message);
      router.push("/profile");
    } else {
      toast.error(res.message);
    }
  };

  return (
    <div className="min-h-screen text-black sm:p-4 bg-background">
      <div className="bg-background sm:bg-white w-full rounded-lg p-2 space-y-4 max-w-2xl mx-auto">
        <div className="space-y-4 border-b pb-6">
          <div className=" flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900 whitespace-nowrap">
              Join Existing Venture
            </h3>
            <div className="h-px  bg-secondary flex-1"></div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Enter Venture ID"
                value={joinId}
                setValue={setJoinId}
              />
            </div>
            <button
              onClick={handleJoin}
              disabled={isJoining}
              className="bg-primary hover:bg-primary/80 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isJoining ? "Joining..." : "Join"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
