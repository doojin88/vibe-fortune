-- saju_tests 테이블에 model_used 컬럼 추가
ALTER TABLE saju_tests
ADD COLUMN IF NOT EXISTS model_used text NOT NULL DEFAULT 'flash'
CHECK (model_used IN ('flash', 'pro'));

COMMENT ON COLUMN saju_tests.model_used IS 'Gemini 모델: flash(무료), pro(Pro 구독자)';
