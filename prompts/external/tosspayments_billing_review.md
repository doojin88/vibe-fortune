# 토스페이먼츠 구독 결제 시스템 검증 및 수정 가이드

## ✅ 무엇이 맞나요 (정확)
- **개념/용어**: 빌링키(billingKey)를 한 번 발급해 고객의 재인증 없이 반복 결제하는 구조는 정확합니다.
- **Basic 인증**: `Authorization: Basic base64(시크릿키 + ":")` 방식이 맞습니다(콜론 필수).
- **orderId 고유성**: 주문번호는 **6~64자, 매 결제마다 고유**해야 합니다.
- **스케줄링 직접 구현**: 토스페이먼츠가 스케줄러를 제공하지 않으므로 Supabase(pg_cron, pg_net/http)로 호출하는 접근은 타당합니다.

---

## ⚠️ 보완이 필요해요 (주의/추가 정보)
- **자동결제 사용 요건**: 자동결제 API는 **추가 계약 후 사용** 항목입니다.
- **customerKey 보안 설계**: 이메일/전화번호처럼 추정 가능한 값은 피하고 **충분히 랜덤한 값(UUID 등)**을 쓰는 것이 안전합니다.
- **authKey 유효시간**: 공식 문서에 10분 제한이 명시되어 있지 않으므로 “짧은 시간 내 사용”으로 표기 권장.
- **SDK 초기화/호출 방식(v2)**: `TossPayments(clientKey)` → `tossPayments.payment().requestBillingAuth()` 형태 사용 권장.

---

## ❌ 무엇이 틀렸나요 (오류/위험)
1. **빌링키 발급 승인 엔드포인트**
   - 문서: `POST /v1/billing/authorizations/{authKey}`
   - 실제: `POST /v1/billing/authorizations/issue`
2. **빌링키 삭제**
   - 공식 가이드에는 **삭제 API 미제공** → DB에서 상태값만 “비활성” 처리
3. **결제 실패 시 ‘즉시 빌링키 삭제’**
   - 삭제 대신 **상태를 failed로 관리**해야 함

---

## 🛠 수정안 요약

### A. 클라이언트 (SDK v2)
```html
<script src="https://js.tosspayments.com/v2"></script>
<script>
  const tossPayments = TossPayments('YOUR_CLIENT_KEY');
  const payment = tossPayments.payment();
  payment.requestBillingAuth({
    customerKey: 'GENERATED_UUID',
    successUrl: location.origin + '/subscription/success',
    failUrl: location.origin + '/subscription/fail',
  });
</script>
```

### B. 서버 — 빌링키 발급(승인)
```ts
await fetch('https://api.tosspayments.com/v1/billing/authorizations/issue', {
  method: 'POST',
  headers: {
    Authorization: 'Basic ' + Buffer.from(process.env.TOSS_SECRET_KEY + ':').toString('base64'),
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ authKey, customerKey }),
});
```

### C. 서버 — 자동결제 승인(최초/정기)
```ts
await fetch(`https://api.tosspayments.com/v1/billing/${billingKey}`, {
  method: 'POST',
  headers: {
    Authorization: 'Basic ' + Buffer.from(process.env.TOSS_SECRET_KEY + ':').toString('base64'),
    'Content-Type': 'application/json',
    'Idempotency-Key': crypto.randomUUID(),
  },
  body: JSON.stringify({
    amount: 9900,
    orderId: 'order_' + crypto.randomUUID(),
    orderName: '사주 분석 Pro 구독',
    customerKey,
  }),
});
```

### D. 스케줄링 (Supabase 예시)
```sql
select cron.schedule(
  'daily-subscription-billing',
  '0 17 * * *',
  $$
  select net.http_post(
    url := 'https://yourdomain.com/api/cron/process-subscriptions',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer YOUR_CRON_SECRET"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
```

---

## ✅ 최종 체크리스트
- [ ] 엔드포인트 교정: `/issue` 사용
- [ ] SDK v2 방식 적용
- [ ] 빌링키 삭제 금지 → 상태값 관리
- [ ] 자동결제 계약 확인
- [ ] customerKey 난수화
- [ ] 멱등키(Idempotency-Key) 적용

---

## 📚 참고 문서
- [Toss Payments Billing API](https://docs.tosspayments.com/reference#자동결제)
- [Toss Payments JavaScript SDK v2](https://docs.tosspayments.com/sdk/v2/js)
- [Supabase pg_cron 공식 문서](https://supabase.com/docs/guides/database/extensions/pgcron)
