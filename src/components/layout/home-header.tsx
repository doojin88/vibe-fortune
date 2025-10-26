'use client';

import Link from 'next/link';
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';

export function HomeHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <span className="font-bold text-xl">Vibe Fortune</span>
        </Link>
        <nav className="flex items-center gap-6 flex-1">
          <Link
            href="/#features"
            className="text-sm font-medium text-muted-foreground hover:text-primary"
          >
            서비스
          </Link>
          <Link
            href="/#pricing"
            className="text-sm font-medium text-muted-foreground hover:text-primary"
          >
            가격
          </Link>
          <Link
            href="/#faq"
            className="text-sm font-medium text-muted-foreground hover:text-primary"
          >
            FAQ
          </Link>
        </nav>
        <SignedOut>
          <SignInButton mode="modal">
            <Button>시작하기</Button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <Link href="/dashboard">
            <Button>이용하기</Button>
          </Link>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
      </div>
    </header>
  );
}
