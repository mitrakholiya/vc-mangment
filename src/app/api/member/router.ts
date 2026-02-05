import { dbConnect } from "@/db.config/dbconnection";
import VcMembershipModel from "@/models/vc-membership.model";
import axios from "axios";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {

        const body = await req.json()
        const { vc_id, user_id, role } = body
        await dbConnect()

        const member = await VcMembershipModel.create({ vc_id, user_id, role })

        return NextResponse.json({
            success: true,
            message: "Member Added Successfully",
            data: member
        })
    } catch (err) {
        console.log("server Error", err);

        return NextResponse.json({
            success: false,
            message: "Server Error"
        })
    }

}