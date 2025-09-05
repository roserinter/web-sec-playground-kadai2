// 実行は npx prisma db seed　(package.jsonの prisma にコマンド追加)
// 上記コマンドで実行する範囲は相対パスを基準にする必要があるので注意
import { v4 as uuid } from "uuid";
import { PrismaClient, Role } from "@prisma/client";
import { UserSeed, userSeedSchema } from "../src/app/_types/UserSeed";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // テスト用のユーザ情報の「種」となる userSeeds を作成
  const userSeeds: UserSeed[] = [
    {
      name: "高負荷 耐子",
      password: "password1111",
      email: "admin01@example.com",
      role: Role.ADMIN,
    },
    {
      name: "不具合 直志",
      password: "password2222",
      email: "admin02@example.com",
      role: Role.ADMIN,
    },
    {
      name: "構文 誤次郎",
      password: "password1111",
      email: "user01@example.com",
      role: Role.USER,
      aboutSlug: "gojiro",
      aboutContent: "構文誤次郎です。<br>よろしくお願いします。",
    },
    {
      name: "仕様 曖昧子",
      password: "password2222",
      email: "user02@example.com",
      role: Role.USER,
      aboutSlug: "aimaiko",
      aboutContent: "仕様曖昧子と申します。仲良くしてください。",
    },
  ];

  // userSeedSchema を使って UserSeeds のバリデーション
  try {
    await Promise.all(
      userSeeds.map(async (userSeed, index) => {
        const result = userSeedSchema.safeParse(userSeed);
        if (result.success) return;
        console.error(
          `Validation error in record ${index}:\n${JSON.stringify(userSeed, null, 2)}`,
        );
        console.error("▲▲▲ Validation errors ▲▲▲");
        console.error(
          JSON.stringify(result.error.flatten().fieldErrors, null, 2),
        );
        throw new Error(`Validation failed at record ${index}`);
      }),
    );
  } catch (error) {
    throw error;
  }

  // 各テーブルの全レコードを削除
  await prisma.user.deleteMany();
  await prisma.session.deleteMany();
  await prisma.stolenContent.deleteMany();
  await prisma.cartSession.deleteMany();
  await prisma.product.deleteMany();
  await prisma.cartItem.deleteMany();

  // ユーザ（user）テーブルにテストデータを挿入
  await prisma.user.createMany({
    data: await Promise.all(
      userSeeds.map(async (userSeed) => ({
        id: uuid(),
        name: userSeed.name,
        password: await bcrypt.hash(userSeed.password, 10), // ここでハッシュ化
        role: userSeed.role,
        email: userSeed.email,
        aboutSlug: userSeed.aboutSlug || null,
        aboutContent: userSeed.aboutContent || "",
      }))
    ),
  });

  // 商品（product）テーブルにテストデータを挿入
  await prisma.product.createMany({
    data: [
      {
        id: "A-001",
        name: "副業で人生逆転！AI自動コード生成マニュアル",
        price: 10000,
      },
      {
        id: "A-002",
        name: "月収7桁を叩き出すCSS講座【完全無料】",
        price: 50000,
      },
      {
        id: "A-003",
        name: "資格不要！ゼロから始める非正規暗号通貨運用術",
        price: 30000,
      },
      {
        id: "A-004",
        name: "\tパワポで月収100万：架空案件で学ぶ「営業芸」完全読本",
        price: 15000,
      },
    ],
  });

  console.log("Seeding completed successfully.");
}

main()
  .catch((e) => console.error(e.message))
  .finally(async () => {
    await prisma.$disconnect();
  });
