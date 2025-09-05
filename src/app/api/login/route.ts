import bcrypt from "bcryptjs";
import { prisma } from "@/libs/prisma";
import { loginRequestSchema } from "@/app/_types/LoginRequest";
import { userProfileSchema } from "@/app/_types/UserProfile";
import type { UserProfile } from "@/app/_types/UserProfile";
import type { ApiResponse } from "@/app/_types/ApiResponse";
import { NextResponse, NextRequest } from "next/server";
import { createSession } from "@/app/api/_helper/createSession";

// キャッシュを無効化して毎回最新情報を取得
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export const POST = async (req: NextRequest) => {
  try {
    const result = loginRequestSchema.safeParse(await req.json());
    if (!result.success) {
      const res: ApiResponse<null> = {
        success: false,
        payload: null,
        message: "リクエストボディの形式が不正です。",
      };
      return NextResponse.json(res);
    }
    const loginRequest = result.data;

    const user = await prisma.user.findUnique({
      where: { email: loginRequest.email },
    });
    if (!user) {
      const res: ApiResponse<null> = {
        success: false,
        payload: null,
        message: "メールアドレスまたはパスワードの組み合わせが正しくありません。",
      };
      return NextResponse.json(res);
    }

    const userAny = user as any;

    // Check lock state
    if (userAny.isLocked) {
      await (prisma as any).loginHistory.create({
        data: {
          userId: userAny.id,
          ip: req.headers.get("x-forwarded-for") ?? "",
          userAgent: req.headers.get("user-agent") ?? "",
          success: false,
        },
      });
      const res: ApiResponse<null> = {
        success: false,
        payload: null,
        message: "アカウントがロックされています。",
      };
      return NextResponse.json(res);
    }

    // パスワードの検証 (bcrypt.compare)
    const isValidPassword = await bcrypt.compare(
      loginRequest.password,
      userAny.password
    );
    if (!isValidPassword) {
      const newFailed = (userAny.failedCount ?? 0) + 1;
      const willLock = newFailed >= 5; // 5回でロック
      const updateData: any = { failedCount: newFailed, isLocked: willLock };
      await prisma.user.update({ where: { id: userAny.id }, data: updateData });

      await (prisma as any).loginHistory.create({
        data: {
          userId: userAny.id,
          ip: req.headers.get("x-forwarded-for") ?? "",
          userAgent: req.headers.get("user-agent") ?? "",
          success: false,
        },
      });

      const res: ApiResponse<null> = {
        success: false,
        payload: null,
        message: willLock
          ? "パスワードの誤入力が続いたためアカウントをロックしました。"
          : "メールアドレスまたはパスワードの組み合わせが正しくありません。",
      };
      return NextResponse.json(res);
    }

    // 認証成功時：failedCount リセット、履歴記録
    const successUpdate: any = { failedCount: 0, isLocked: false, lastLoginAt: new Date() };
    await prisma.user.update({ where: { id: userAny.id }, data: successUpdate });
    await (prisma as any).loginHistory.create({
      data: {
        userId: userAny.id,
        ip: req.headers.get("x-forwarded-for") ?? "",
        userAgent: req.headers.get("user-agent") ?? "",
        success: true,
      },
    });

    // セッションベース認証のみをサポート
    const tokenMaxAgeSeconds = 60 * 60 * 3; // 3時間
    await createSession(userAny.id, tokenMaxAgeSeconds);
    const res: ApiResponse<UserProfile> = {
      success: true,
      payload: userProfileSchema.parse(userAny),
      message: "",
    };
    return NextResponse.json(res);
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : "Internal Server Error";
    console.error(errorMsg);
    const res: ApiResponse<null> = {
      success: false,
      payload: null,
      message: "ログインのサーバサイドの処理に失敗しました。",
    };
    return NextResponse.json(res);
  }
};
