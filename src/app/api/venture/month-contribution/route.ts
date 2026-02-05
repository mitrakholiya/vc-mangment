import { NextResponse } from "next/server"
import { dbConnect } from "@/db.config/dbconnection";
import jwt from "jsonwebtoken"

import { cookies } from "next/headers";
import MonthlyContributionModel from "@/models/monthly-contribution.model";



interface CustomJwtPayload extends jwt.JwtPayload {
    userId: string;
}

export async function POST(req: Request) {
    try {

      
        
        const body = await req.json();

       
        const cookieStore = await cookies();

        const token = cookieStore.get("token")?.value;
        

        const decode = jwt.verify(token!, process.env.JWT_SECRET!) as CustomJwtPayload
        
        await dbConnect()



        const { _id,monthly_contribution } = body
       

        const membership = await MonthlyContributionModel.create({
            vc_id:_id,
            user_id: decode.userId,
            amount: monthly_contribution,
            month:new Date().getMonth(),
            year:new Date().getFullYear(),
            status:"pending",
        })
      
        return NextResponse.json({
            success: true,
            message: "VC Created Successfully",
            data: membership
        })

    } catch (err) {
        console.log("server Error", err);

        return NextResponse.json({
            success: false,
            message: "Server Error",
            error: err
        })
    }

}