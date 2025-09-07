// サーバコンポーネントに変更し、サーバ側で認証・DB取得を行います
import React from "react";
import { redirect } from "next/navigation";
import { prisma } from "../../../libs/prisma";
import { verifySessionServer } from "../../api/_helper/verifySession";

const Page = async () => {
  const userId = await verifySessionServer();
  if (!userId) {
    redirect("/login");
  }

  const records = await (prisma as any).loginHistory.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <main>
      <div className="text-2xl font-bold">ログイン履歴</div>
      <div className="mt-4">
        {records.length === 0 ? (
          <div>履歴がありません。</div>
        ) : (
          records.map((r: any) => (
            <div key={r.id} className="border rounded p-3 mb-2">
              <div className="text-sm text-slate-400">{new Date(r.createdAt).toLocaleString()}</div>
              <div>成功: {r.success ? "はい" : "いいえ"}</div>
              <div>IP: {r.ip || "(不明)"}</div>
              <div>UserAgent: {r.userAgent || "(不明)"}</div>
            </div>
          ))
        )}
      </div>
    </main>
  );
};

export default Page;
