import { cookies } from "next/headers";
import { prisma } from "@/libs/prisma";

/**
 * Cookie の sessionId から userId を取得（Route Handler / Server Action 用）
 * 無効な場合は DB の Session レコードも、Cookie も削除する。
 * Cookie の書き換えを行うため、Route Handler または Server Action のみで使用してください。
 */
export const verifySession = async (): Promise<string | null> => {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session_id")?.value;

  if (!sessionId) return null;

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
  });

  const now = new Date();
  if (!session || session.expiresAt <= now) {
    // 無効なセッションは削除 空文字を上書き・有効期限0
    await prisma.session.deleteMany({ where: { id: sessionId } });
    cookieStore.set("session_id", "", {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      maxAge: 0,
      secure: false, // 本番は true に
    });
    return null;
  }

  // セッションの有効期限を延長
  const tokenMaxAgeSeconds = 60 * 60 * 3; // 3時間
  const newExpiry = new Date(now.getTime() + tokenMaxAgeSeconds * 1000);
  await prisma.session.update({
    where: { id: sessionId },
    data: { expiresAt: newExpiry },
  });

  cookieStore.set("session_id", sessionId, {
    path: "/",
    httpOnly: true,
    sameSite: "strict",
    maxAge: tokenMaxAgeSeconds,
    secure: false,
  });

  return session.userId;
};

/**
 * サーバコンポーネントやその他読み取り専用で使うための関数。
 * Cookie を書き換えない（set を呼ばない）ので、Server Component から安全に呼べます。
 */
export const verifySessionServer = async (): Promise<string | null> => {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session_id")?.value;
  if (!sessionId) return null;

  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session) return null;
  const now = new Date();
  if (session.expiresAt <= now) return null;

  return session.userId;
};
