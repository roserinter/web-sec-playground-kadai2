// ▼▼ 認証モードにあわせていずれかを有効にする

const AUTH_MODE = "session" as "session" | "jwt";
// const AUTH_MODE = "jwt" as "session" | "jwt";

// 認証モードの設定 (ここは変更しない)
export const AUTH = {
  mode: AUTH_MODE,
  isSession: AUTH_MODE === "session",
  isJWT: AUTH_MODE === "jwt",
} as const;
