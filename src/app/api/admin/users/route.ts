import { NextResponse } from "next/server";
import { verifySession } from "@/app/api/_helper/verifySession";
import { prisma } from "@/libs/prisma";

export async function GET() {
	const userId = await verifySession();
	if (!userId) return NextResponse.json({ success: false, message: "unauthorized" }, { status: 401 });

	const me = await prisma.user.findUnique({ where: { id: userId } });
	if (!me || me.role !== "ADMIN") return NextResponse.json({ success: false, message: "forbidden" }, { status: 403 });

	const locked = await prisma.user.findMany({ where: { isLocked: true } });

	const payload = locked.map((u) => ({
		id: u.id,
		name: u.name,
		email: u.email,
		failedCount: u.failedCount,
		lastLoginAt: u.lastLoginAt,
	}));

	return NextResponse.json({ success: true, payload });
}

