import { PricingCard } from './pricing-card';

const pricingPlans = [
  {
    title: '무료',
    price: '₩0',
    description: '누구나 무료로 시작',
    features: [
      '초기 3회 분석 가능',
      '기본 AI 분석 (gemini-2.5-flash)',
      '분석 이력 저장',
      '마크다운 결과 복사',
    ],
    ctaText: '무료로 시작하기',
    ctaLink: '/dashboard',
    isPopular: false,
    isPro: false,
  },
  {
    title: 'Pro',
    price: '₩9,900',
    description: '고급 분석과 더 많은 혜택',
    features: [
      '월 10회 분석 가능',
      '고급 AI 분석 (gemini-2.5-pro)',
      '직업운, 사업운 분석',
      '월별 운세 및 길일 분석',
      '우선 지원',
    ],
    ctaText: 'Pro 시작하기',
    ctaLink: '/subscription',
    isPopular: true,
    isPro: true,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="bg-gray-50 px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-12 text-center text-4xl font-bold text-gray-900">
          요금 안내
        </h2>
        <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
          {pricingPlans.map((plan) => (
            <PricingCard
              key={plan.title}
              title={plan.title}
              price={plan.price}
              description={plan.description}
              features={plan.features}
              ctaText={plan.ctaText}
              ctaLink={plan.ctaLink}
              isPopular={plan.isPopular}
              isPro={plan.isPro}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
