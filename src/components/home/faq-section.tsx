import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    question: '어떻게 사용하나요?',
    answer:
      'Google 계정으로 로그인 후 생년월일과 출생시간을 입력하면 AI가 자동으로 사주를 분석해드립니다.',
  },
  {
    question: '무료 체험 후 비용이 발생하나요?',
    answer:
      '초기 3회는 무료로 이용하실 수 있습니다. 이후 월 9,900원의 Pro 구독을 통해 월 10회 고급 분석을 이용하실 수 있습니다.',
  },
  {
    question: 'Pro 구독과 무료 버전의 차이는 무엇인가요?',
    answer:
      'Pro 구독은 더 정교한 AI 모델(gemini-2.5-pro)을 사용하며, 직업운, 사업운, 월별 운세 등 추가 분석을 제공합니다. 또한 월 10회까지 분석이 가능합니다.',
  },
  {
    question: '개인정보는 안전한가요?',
    answer:
      '네, 모든 데이터는 암호화되어 안전하게 저장되며, Google 인증을 통해 보안이 강화되어 있습니다. 사주분석 결과는 본인만 확인할 수 있습니다.',
  },
  {
    question: '출생시간을 모르는 경우에도 가능한가요?',
    answer:
      '네, 출생시간을 모르시는 경우 "출생시간 모름"을 선택하시면 됩니다. 다만 더 정확한 분석을 위해서는 출생시간 입력을 권장합니다.',
  },
  {
    question: '구독은 언제든지 취소할 수 있나요?',
    answer:
      '네, Pro 구독은 언제든지 취소 가능하며, 다음 결제일까지 Pro 혜택이 유지됩니다.',
  },
];

export function FAQSection() {
  return (
    <section id="faq" className="bg-white px-6 py-20">
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-12 text-center text-4xl font-bold text-gray-900">
          자주 묻는 질문
        </h2>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left text-lg font-medium">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-gray-600">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
