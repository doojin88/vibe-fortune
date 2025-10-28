import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: 'Vibe Fortune - AI 기반 사주분석 서비스',
  description:
    'Google 계정으로 1분 안에 시작하는 AI 사주팔자 분석. 무료 체험 후 Pro 구독으로 월 10회 고급 분석을 이용하세요.',
  keywords: ['사주분석', 'AI 사주', '사주팔자', 'Gemini AI', '무료 사주'],
  openGraph: {
    title: 'Vibe Fortune - AI 기반 사주분석 서비스',
    description: 'Google 계정으로 1분 안에 시작하는 AI 사주팔자 분석',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vibe Fortune - AI 기반 사주분석 서비스',
    description: 'Google 계정으로 1분 안에 시작하는 AI 사주팔자 분석',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="antialiased font-sans">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
