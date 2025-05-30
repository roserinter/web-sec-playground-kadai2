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

  // [3] JWTを改竄
  // JWTは「header.payload.signature」の3つの部分に分かれている
  const [header, payloadPart, signature] = jwt.split(".");

  // payloadをBase64デコードしてPayloadを取得
  const originalPayload = JSON.parse(
    atob(payloadPart.replace(/-/g, "+").replace(/_/g, "/")),
  );
  // Payloadの内容を改竄（ role を USER から ADMIN に変更）
  const tamperedPayload = { ...originalPayload, role: "ADMIN" };

  // 改ざんしたpayloadをBase64エンコード
  const tamperedPayloadBase64 = btoa(JSON.stringify(tamperedPayload))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  // 改ざんしたJWTを作成（署名はそのまま利用）
  const tamperedJwt = `${header}.${tamperedPayloadBase64}.${signature}`;
  console.log(`[3] Tampered JWT: ${tamperedJwt}\n`);

  // [4] 改竄したJWTのデコード
  const tamperedDecoded = decodeJwt(tamperedJwt);
  console.log(
    `[4] Tampered Decoded : ${JSON.stringify(tamperedDecoded, null, 2)}\n`,
  );

  // [5] 改竄したJWTの検証 → 署名により改竄を検出できるので失敗
  try {
    const verified = await jwtVerify(tamperedJwt, secret);
    console.log(`[5] Verified : ${JSON.stringify(verified, null, 2)}\n`);
  } catch {
    console.error("[5] Tampered JWT verification failed.");
  }
};

main();

// 実行するには以下のコマンドを使用してください。
// npx tsx .lab/jwt-2.ts
