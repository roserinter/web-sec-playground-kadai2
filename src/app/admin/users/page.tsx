"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/app/_components/Button";

type LockedUser = {
  id: string;
  name: string;
  email: string;
  failedCount: number;
  lastLoginAt: string | null;
};

const fetchLocked = async (): Promise<LockedUser[]> => {
  const res = await fetch("/api/admin/users", { credentials: "same-origin" });
  if (!res.ok) throw new Error("fetch failed");
  const body = await res.json();
  if (!body.success) throw new Error(body.message || "failed");
  return body.payload as LockedUser[];
};

export default function Page() {
  const [users, setUsers] = useState<LockedUser[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchLocked();
      setUsers(data);
    } catch (e: any) {
      setError(e?.message || "エラーが発生しました");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const unlock = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users/unlock", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const body = await res.json();
      if (!body.success) throw new Error(body.message || "unlock failed");
      await load();
    } catch (e: any) {
      setError(e?.message || "解除に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <h1 className="text-2xl font-bold mb-4">ロック中のユーザ一覧（管理者専用）</h1>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {loading && <div>読み込み中...</div>}
      {!loading && users && users.length === 0 && <div>ロック中のユーザはありません。</div>}
      <div className="space-y-3">
        {users?.map((u) => (
          <div key={u.id} className="border rounded p-3 flex items-center justify-between">
            <div>
              <div className="font-semibold">
                {u.name} ({u.email})
              </div>
              <div className="text-sm text-slate-500">
                失敗回数: {u.failedCount}{" "}
                {u.lastLoginAt ? `最終: ${new Date(u.lastLoginAt).toLocaleString()}` : ""}
              </div>
            </div>
            <div>
              <Button onClick={() => unlock(u.id)} disabled={loading}>
                解除
              </Button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
