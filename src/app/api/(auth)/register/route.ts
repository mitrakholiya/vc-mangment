import { NextResponse } from "next/server"
import UserModel from "@/models/user.model"
import bcrypt from "bcryptjs";
import { dbConnect } from "../../../../db.config/dbconnection";


export async function POST(req: Request) {
    console.log("Start...");
    try {
        const body = await req.json();
        const { name, email, password, phone } = body
        await dbConnect()

        console.log("inside the block");

        const hashedpass = await bcrypt.hash(password, 10)
        console.log("Pass...", hashedpass);
        const user = await UserModel.create({ name, email, password_hash: hashedpass, phone })

        return NextResponse.json({
            success: true,
            user: { email }
        })
    } catch (err) {
        console.log("server Error", err);

        return NextResponse.json({
            success: false,
            message: "Server Error"
        })
    }

}