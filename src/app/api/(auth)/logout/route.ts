import { NextResponse } from "next/server";

export const POST = async () => {
    const response = NextResponse.json({
        message: "Log Out Successfull",
    })
    response.cookies.set("token", "", {
        httpOnly: true, maxAge: 0
    })
    response.cookies.set("haveVC", "", {
        httpOnly: true, maxAge: 0
    })
    return response
}