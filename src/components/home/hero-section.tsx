'use client';

import Link from 'next/link';
import { SignInButton, SignedIn, SignedOut } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';

export function HeroSection() {
  return (
    <section
      id="hero"
      className="relative flex min-h-[600px] items-center justify-center bg-linear-to-br from-indigo-50 via-white to-purple-50 px-6 py-20"
    >
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="mb-6 text-5xl font-bold tracking-tight text-gray-900 md:text-6xl lg:text-7xl">
          AI가 분석하는 나만의 사주팔자
        </h1>
        <p className="mb-8 text-xl text-gray-600 md:text-2xl">
          Google 계정으로 1분 안에 시작하세요
        </p>

        <div className="flex justify-center">
          <SignedOut>
            <SignInButton mode="modal">
              <Button size="lg" className="text-lg px-8 py-6">
                시작하기
              </Button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard">
              <Button size="lg" className="text-lg px-8 py-6">
                대시보드로 이동
              </Button>
            </Link>
          </SignedIn>
        </div>
      </div>
    </section>
  );
}
