'use client';

import { HomeHeader } from '@/components/layout/home-header';
import { HeroSection } from '@/components/home/hero-section';
import { FeaturesSection } from '@/components/home/features-section';
import { PricingSection } from '@/components/home/pricing-section';
import { FAQSection } from '@/components/home/faq-section';
import { Footer } from '@/components/home/footer';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <HomeHeader />
      <main>
        <HeroSection />
        <FeaturesSection />
        <PricingSection />
        <FAQSection />
      </main>
      <Footer />
    </div>
  );
}
