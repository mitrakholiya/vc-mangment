import { NextResponse } from "next/server"
import { dbConnect } from "@/db.config/dbconnection";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function GET(req: Request) {
    try {
        dbConnect()
        const cookieStore = await cookies()

        const token = cookieStore.get("token")?.value

        if (!token) {
            return NextResponse.json({
                success: false,
                message: "User Is Not Logged In"
            })
        }

        console.log("token", token);
        
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET!)

        console.log("decodedToken", decodedToken);
        
        const response = NextResponse.json({
            success: true,
            message: "User Data Full",
            data: decodedToken
        })

        return response


    } catch (err) {
        console.log("server Error", err);

        return NextResponse.json({
            success: false,
            message: "Server Error"
        })
    }

}