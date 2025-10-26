import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import { loadCurrentUser } from "@/features/auth/server/load-current-user";
import { CurrentUserProvider } from "@/features/auth/context/current-user-context";

export const metadata: Metadata = {
  title: 'Vibe Fortune - AI 기반 사주분석 서비스',
  description:
    'Google 계정으로 1분 안에 시작하는 AI 사주팔자 분석. 무료로 전문가 수준의 상세한 분석을 받아보세요.',
  openGraph: {
    title: 'Vibe Fortune - AI 기반 사주분석 서비스',
    description: 'Google 계정으로 1분 안에 시작하는 AI 사주팔자 분석',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const currentUser = await loadCurrentUser();

  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="antialiased font-sans">
        <Providers>
          <CurrentUserProvider initialState={currentUser}>
            {children}
          </CurrentUserProvider>
        </Providers>
      </body>
    </html>
  );
}
