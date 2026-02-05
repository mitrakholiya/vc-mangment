import { NextResponse } from "next/server"
import UserModel from "@/models/user.model"
import bcrypt from "bcryptjs";
import { dbConnect } from "@/db.config/dbconnection";
import jwt from "jsonwebtoken"

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, password } = body
        await dbConnect()

        const user = await UserModel.findOne({ email })
        if (!user) {
            return NextResponse.json({
                success: false,
                message: "not Match any"
            })
        }

        const isMatch = await bcrypt.compare(password, user.password_hash)

        if (!isMatch) {
            return NextResponse.json({
                success: false,
                message: "Password Is not match"
            })
        }

        const token = await jwt.sign({
            userId: user._id,
            email: user.email,
            name: user.name,
            phone: user.phone,
        }, process.env.JWT_SECRET!, {
            expiresIn: "1d"
        })

        const response = NextResponse.json({
            success: true,
            message: "Login Success Full"
        })

        response.cookies.set("token", token, {
            httpOnly: true
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