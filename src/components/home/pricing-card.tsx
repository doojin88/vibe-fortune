'use client';

import { Check } from 'lucide-react';
import Link from 'next/link';
import { SignInButton, SignedIn, SignedOut } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type PricingCardProps = {
  title: string;
  price: string;
  description: string;
  features: string[];
  ctaText: string;
  ctaLink?: string;
  isPopular?: boolean;
  isPro?: boolean;
};

export function PricingCard({
  title,
  price,
  description,
  features,
  ctaText,
  ctaLink,
  isPopular = false,
  isPro = false,
}: PricingCardProps) {
  return (
    <Card
      className={`relative flex flex-col ${
        isPopular ? 'border-2 border-indigo-500 shadow-xl' : 'border shadow-md'
      }`}
    >
      {isPopular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <Badge className="bg-indigo-600 px-4 py-1 text-sm">인기</Badge>
        </div>
      )}
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">{title}</CardTitle>
        <div className="mt-4">
          <span className="text-4xl font-bold">{price}</span>
          {isPro && <span className="text-gray-500 ml-2">/월</span>}
        </div>
        <CardDescription className="mt-2">{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <Check className="h-5 w-5 text-green-600" />
              </div>
              <span className="text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        {isPro ? (
          <>
            <SignedOut>
              <SignInButton mode="modal">
                <Button size="lg" className="w-full">
                  {ctaText}
                </Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link href={ctaLink || '/subscription'} className="w-full">
                <Button size="lg" className="w-full">
                  {ctaText}
                </Button>
              </Link>
            </SignedIn>
          </>
        ) : (
          <>
            <SignedOut>
              <SignInButton mode="modal">
                <Button size="lg" variant="outline" className="w-full">
                  {ctaText}
                </Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link href={ctaLink || '/dashboard'} className="w-full">
                <Button size="lg" variant="outline" className="w-full">
                  {ctaText}
                </Button>
              </Link>
            </SignedIn>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
