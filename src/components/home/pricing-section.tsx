import { Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const benefits = [
  '무제한 사주분석',
  '이력 관리',
  'AI 기반 상세 분석',
  '광고 없음',
];

export function PricingSection() {
  return (
    <section id="pricing" className="bg-gray-50 px-6 py-20">
      <div className="mx-auto max-w-4xl">
        <h2 className="mb-12 text-center text-4xl font-bold text-gray-900">
          요금 안내
        </h2>
        <div className="flex justify-center">
          <Card className="w-full max-w-md border-2 border-indigo-200 shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold text-indigo-600">
                완전 무료
              </CardTitle>
              <CardDescription className="text-lg">
                구독 없이 누구나 무료로 이용 가능
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <Check className="h-5 w-5 text-green-600" />
                    </div>
                    <span className="text-gray-700">{benefit}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
