"use client";
import React, { useEffect, useState } from "react";
import { Input } from "@/components/Input";
// import { IMember } from "@/models/venture.model";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import axios from "axios"
import { createVenture } from "@/hooks/venture/useVenture";
import { createMembership } from "@/hooks/membership/membership";

const Page = () => {
    const router = useRouter()
    useEffect(() => {
        const getUser = async () => {
            const res = await axios.get("/api/getuser")
            if (res.data.success) {

                setVc(prev => ({
                    ...prev,
                    created_by: res.data.data.userId,
                }));
            }
        }
        getUser()
    }, [])

    const [vc, setVc] = useState({
        name: "",
        currency: "",
        monthly_contribution: "",
        loan_interest_percent: "",
        max_loan_percent: "",
        created_by: "",
    });
    // // Get User Created





    // SUBMIT (final object)
    const submitHandler = async () => {
        const payload = {
            ...vc,
            name: String(vc.name),
            currency: String(vc.currency),
            monthly_contribution: Number(vc.monthly_contribution),
            loan_interest_percent: Number(vc.loan_interest_percent),
            max_loan_percent: Number(vc.max_loan_percent),
        };


        const response = await createVenture(payload);

        if (response?.success) {
            toast.success("Sussecfull")
            console.log(response.data);
            
            const res= await createMembership({
                vc_id: response.data._id,
                role:"ADMIN"
            })

            if(res?.success){
                toast.success(res?.message)
            }


            setVc({
                name: "",
                currency: "",
                monthly_contribution: "",
                loan_interest_percent: "",
                max_loan_percent: "",
                created_by: "",
            })
            router.push("/profile")
        }
    };

    return (
        <div className="min-h-screen text-black  p-4">
            <div className="bg-white w-full rounded-lg p-2 space-y-4 ">

                {/* VC DETAILS */}
                <h2 className="text-xl font-semibold">VC Details</h2>
                {/* Name */}
                <div>
                    <Input
                        type="text"
                        placeholder="VC Name"
                        value={vc.name}
                        setValue={(val) => setVc({ ...vc, name: val })}
                    />
                </div>
                <div className="">
                    <Input
                        type="text"
                        placeholder="Total Currency"
                        value={vc.currency}
                        setValue={(val) =>
                            setVc({ ...vc, currency: val })
                        }
                    />
                </div>
                <div className="">

                    <Input
                        type="text"
                        placeholder="Committed Capital Currency"
                        value={vc.monthly_contribution}
                        setValue={(val) =>
                            setVc({ ...vc, monthly_contribution: val })
                        }
                    />
                </div>
                <div className="">

                    <Input
                        type="number"
                        placeholder="Loan Interest Percentage"
                        value={vc.loan_interest_percent}
                        setValue={(val) =>
                            setVc({ ...vc, loan_interest_percent: val })
                        }
                    />
                </div>
                <div className="">


                    <Input
                        type="number"
                        placeholder="Max Loan Percentage"
                        value={vc.max_loan_percent}
                        setValue={(val) =>
                            setVc({ ...vc, max_loan_percent: val })
                        }
                    />
                </div>

                {/* MEMBERS */}
                {/* <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-semibold">Members</h3>
                            <button
                                onClick={addMember}
                                className="bg-gray-900 text-white px-3 py-1 rounded"
                            >
                                Add Member
                            </button>
                        </div>

                        {members.map((member, index) => (
                            <div
                                key={index}
                                className="border rounded-md p-4 space-y-3 bg-gray-50"
                            >
                                <div className="flex justify-between items-center">
                                    <span className="font-medium">
                                        Member {index + 1}
                                    </span>
                                    <button
                                        onClick={() => removeMember(index)}
                                        className="text-red-600 text-sm"
                                    >
                                        Delete
                                    </button>
                                </div>

                                <Input
                                    type="text"
                                    placeholder="Name"
                                    value={member.name}
                                    setValue={(val) =>
                                        updateMember(index, "name", val)
                                    }
                                />

                                <Input
                                    type="text"
                                    placeholder="Email"
                                    value={member.email}
                                    setValue={(val) =>
                                        updateMember(index, "email", val)
                                    }
                                />

                                <Input
                                    type="text"
                                    placeholder="Phone Number"
                                    value={member.phoneNumber}
                                    setValue={(val) =>
                                        updateMember(index, "phoneNumber", val)
                                    }
                                />

                                <select
                                    value={member.role}
                                    onChange={(e) =>
                                        updateMember(index, "role", e.target.value)
                                    }
                                    className="w-full border rounded px-3 py-2"
                                >
                                    <option value="partner">Partner</option>
                                    <option value="admin">Admin</option>
                                    <option value="investor">Investor</option>
                                </select>
                            </div>
                        ))}
                    </div> */}

                {/* SUBMIT */}
                <button
                    onClick={submitHandler}
                    className="w-full bg-blue-600 text-white py-2 rounded-md"
                >
                    Submit
                </button>
            </div>
        </div>
    );
};

export default Page;
