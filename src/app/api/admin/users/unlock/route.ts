import { NextResponse } from "next/server";
import { verifySession } from "@/app/api/_helper/verifySession";
import { prisma } from "@/libs/prisma";

export async function POST(req: Request) {
	const userId = await verifySession();
	if (!userId) return NextResponse.json({ success: false, message: "unauthorized" }, { status: 401 });

	const me = await prisma.user.findUnique({ where: { id: userId } });
	if (!me || me.role !== "ADMIN") return NextResponse.json({ success: false, message: "forbidden" }, { status: 403 });

	const body = await req.json();
	const id: string | undefined = body?.id;
	if (!id) return NextResponse.json({ success: false, message: "missing id" }, { status: 400 });

	await prisma.user.update({ where: { id }, data: { isLocked: false, failedCount: 0 } });

	return NextResponse.json({ success: true });
}

