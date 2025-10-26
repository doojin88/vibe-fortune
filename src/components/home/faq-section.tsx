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
    question: '비용이 발생하나요?',
    answer:
      '아니요, Vibe Fortune은 완전 무료 서비스입니다. 구독이나 결제 없이 모든 기능을 이용하실 수 있습니다.',
  },
  {
    question: '개인정보는 안전한가요?',
    answer:
      '네, 모든 데이터는 암호화되어 안전하게 저장되며, Google 인증을 통해 보안이 강화되어 있습니다.',
  },
  {
    question: '분석 결과는 얼마나 정확한가요?',
    answer:
      'Google Gemini API를 활용하여 20년 경력의 전문 사주상담사 수준의 분석을 제공합니다.',
  },
  {
    question: '출생시간을 모르는 경우에도 가능한가요?',
    answer:
      '네, 출생시간을 모르시는 경우 "출생시간 모름"을 선택하시면 됩니다. 다만 더 정확한 분석을 위해서는 출생시간 입력을 권장합니다.',
  },
  {
    question: '분석 결과는 얼마나 보관되나요?',
    answer:
      '분석 결과는 영구적으로 저장되며, 언제든지 대시보드에서 다시 확인하실 수 있습니다.',
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
