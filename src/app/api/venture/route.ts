import { NextResponse } from "next/server"
import { dbConnect } from "../../../db.config/dbconnection";
import VentureModel from "@/models/venture.model";
import jwt from "jsonwebtoken"

import { cookies } from "next/headers";



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



        const { created_by, name, currency, monthly_contribution, loan_interest_percent, max_loan_percent } = body

        const newVC = await VentureModel.create({
            created_by,
            name,
            currency,
            monthly_contribution,
            loan_interest_percent,
            max_loan_percent,
            fund_wallet: 0,
            status: "inactive"
        })
   
        return NextResponse.json({
            success: true,
            message: "VC Created Successfully",
            data: newVC
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


export async function GET(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;
        const decode = jwt.verify(token!, process.env.JWT_SECRET!) as CustomJwtPayload
        await dbConnect()
        const vc = await VentureModel.find({ created_by : decode.userId })
        console.log(vc);
        if (vc === null) {
            return NextResponse.json({
                success: false,
                message: "VC Not Found",
            })
        }
        // cookieStore.set("haveVC", decode.userId, {
        //     httpOnly: true,
        //     sameSite: "strict",
        //     maxAge: 60 * 60 * 24 * 7,
        // })
        return NextResponse.json({
            success: true,
            message: "VC Found Successfully",
            data: vc
        })
    } catch (error) {
        console.log("server Error", error);
        return NextResponse.json({
            success: false,
            message: "Server Error",
            error: error
        })
    }
}
