import { Sparkles, UserCircle, History, FileText } from 'lucide-react';
import { FeatureCard } from './feature-card';

const features = [
  {
    icon: Sparkles,
    title: 'AI 기반 전문 분석',
    description:
      'Google Gemini API를 활용한 20년 경력 사주상담사 수준의 분석',
  },
  {
    icon: UserCircle,
    title: '간편한 Google 로그인',
    description: '클릭 한 번으로 시작, 복잡한 회원가입 절차 없음',
  },
  {
    icon: History,
    title: '분석 이력 관리',
    description: '과거 분석 결과를 언제든 다시 확인 가능',
  },
  {
    icon: FileText,
    title: '마크다운 렌더링',
    description: '보기 쉽고 구조화된 분석 결과 제공',
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="bg-white px-6 py-20">
      <div className="mx-auto max-w-7xl">
        <h2 className="mb-12 text-center text-4xl font-bold text-gray-900">
          주요 기능
        </h2>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
