import { SignJWT, jwtVerify, decodeJwt } from "jose";

// JWTの秘密鍵 (通常は環境変数として設定して、そこから取得する)
const JWT_SECRET = "ABCDEFG123456789UVWXYZ";

const main = async () => {
  // JWTのペイロード (本体のデータ)
  const payload = {
    id: "12345",
    name: "寝屋川タヌキ",
    role: "USER",
  };

  const secret = new TextEncoder().encode(JWT_SECRET);
  const tokenMaxAgeSeconds = 5; // トークンの有効期限（秒単位） 5秒!
  const expiresAt = new Date(Date.now() + tokenMaxAgeSeconds * 1000);

  // [1] JWTの生成
  const jwt = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(expiresAt)
    .sign(secret);
  console.log(`[1] JWT: ${jwt}\n`);

  // [2] JWTのデコード (署名を検証せずにペイロードを取得)
  const decoded = decodeJwt(jwt);
  console.log(`[2] Decoded : ${JSON.stringify(decoded, null, 2)}\n`);

  // [3] JWTの有効期限を確認
  const now = new Date();
  const expirationDate = new Date(decoded.exp! * 1000);
  const toJST = (date: Date) =>
    date.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
  console.log(`[3a] Current Date: ${toJST(now)}`);
  console.log(`[3b] JWT Expiration Date: ${toJST(expirationDate)}\n`);

  // [4a] JWTの検証1
  try {
    const verified = await jwtVerify(jwt, secret);
    console.log(`[4a] Verified : ${JSON.stringify(verified, null, 2)}\n`);
  } catch {
    console.error("[4a] JWT verification failed.");
  }

  // JWTの有効期限が切れ待ち (10秒待機)
  const wait = 10;
  process.stdout.write(`Waiting for ${wait} seconds... `);
  for (let i = 0; i < wait; i++) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    process.stdout.write(".");
  }
  console.log("\n");

  // [4b] JWTの検証2 (有効期限切れのJWTを検証) → 失敗するはず
  try {
    const verified = await jwtVerify(jwt, secret);
    console.log(`[4b] Verified : ${JSON.stringify(verified, null, 2)}\n`);
  } catch {
    console.error("[4b] JWT verification failed.");
  }
};

main();

// 実行するには以下のコマンドを使用してください。
// npx tsx .lab/jwt-1.ts
