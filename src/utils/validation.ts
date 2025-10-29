/** 이메일 정규식 패턴 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * 이메일 형식이 유효한지 검증합니다.
 *
 * @param email - 검증할 이메일 주소
 * @returns 유효한 이메일이면 true, 그렇지 않으면 false
 *
 * @example
 * isValidEmail('test@example.com'); // true
 * isValidEmail('invalid-email'); // false
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }
  return EMAIL_PATTERN.test(email.trim());
}

/**
 * 숫자가 양수(0보다 큼)인지 검증합니다.
 *
 * @param num - 검증할 숫자
 * @returns 양수이면 true, 그렇지 않으면 false (0 또는 음수는 false)
 *
 * @example
 * isPositiveNumber(10); // true
 * isPositiveNumber(0); // false
 * isPositiveNumber(-5); // false
 */
export function isPositiveNumber(num: number): boolean {
  return typeof num === 'number' && num > 0;
}
