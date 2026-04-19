import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "クトゥルフTRPG キャラシート作成",
  description: "初心者向けのクトゥルフ神話TRPGキャラクターシート作成アプリ"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}