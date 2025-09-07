import NextLink from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCode } from "@fortawesome/free-solid-svg-icons";

const links = [
  {
    href: "/login",
    label: "ログイン",
    info: "セッションベース認証入門/トークンベース認証入門",
  },
  {
    href: "/signup",
    label: "サインアップ",
    info: "ServerActions (Custom Invocation) 入門",
  },
  {
    href: "/member/about",
    label: "公開プロフィールの確認・編集",
    info: "ログインが必要なコンテンツ",
  },
];

const Page: React.FC = () => {
  return (
    <main>
      <div className="text-2xl font-bold">Main</div>
      <div className="mt-4 ml-2 gap-y-2">
        {links.map(({ href, label, info }) => (
          <div key={href} className="flex items-center">
            <FontAwesomeIcon icon={faCode} className="mr-1.5" />
            <NextLink href={href} className="mr-2 hover:underline">
              {label}
            </NextLink>
            <div className="text-xs text-slate-600">※ {info}</div>
          </div>
        ))}
      </div>
    </main>
  );
};

export default Page;
