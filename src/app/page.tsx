import { HomeHeader } from '@/components/layout/home-header';
import { HeroSection } from '@/components/home/hero-section';
import { FeaturesSection } from '@/components/home/features-section';
import { PricingSection } from '@/components/home/pricing-section';
import { FAQSection } from '@/components/home/faq-section';

export const metadata = {
  title: 'Vibe Fortune - AI 기반 사주분석 서비스',
  description:
    'Google 계정으로 1분 안에 시작하는 AI 사주팔자 분석. 무료로 전문가 수준의 상세한 분석을 받아보세요.',
  openGraph: {
    title: 'Vibe Fortune - AI 기반 사주분석 서비스',
    description: 'Google 계정으로 1분 안에 시작하는 AI 사주팔자 분석',
  },
};

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
    </div>
  );
}
