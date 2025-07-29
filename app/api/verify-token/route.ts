import { jwtVerify } from "jose"
import { NextResponse } from "next/server"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "dklsjh786324#8362f")

export async function POST(req: Request) {
    try {
        const { token } = await req.json()

        if (!token) {
            return NextResponse.json({ valid: false, error: "Token required" }, { status: 400 })
        }

        await jwtVerify(token, JWT_SECRET)

        return NextResponse.json({ valid: true }, { status: 200 })
    } catch (error) {
        return NextResponse.json({ valid: false, error: "Invalid token" }, { status: 401 })
    }
}

export async function GET() {
    return NextResponse.json({ message: "Use POST to verify token" }, { status: 405 })
}
