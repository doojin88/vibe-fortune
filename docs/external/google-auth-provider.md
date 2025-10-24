# Google Auth Provider 개념 정리

## 1. Google Auth Provider란?

Google Auth Provider는 **Google 계정을 사용하여 제3자 애플리케이션에 로그인할 수 있게 해주는 인증 제공자**입니다.

---

## 2. 작동 원리 (OAuth 2.0)

### 2.1 기본 플로우

```
1. [사용자] "Google로 로그인" 버튼 클릭
   ↓
2. [애플리케이션] Google 로그인 페이지로 리다이렉트
   ↓
3. [사용자] Google 계정으로 로그인 및 권한 승인
   ↓
4. [Google] 인증 코드 발급 후 애플리케이션으로 리다이렉트
   ↓
5. [애플리케이션] 인증 코드로 액세스 토큰 교환
   ↓
6. [애플리케이션] 액세스 토큰으로 사용자 정보 조회
   ↓
7. [완료] 사용자 로그인 상태 유지
```

### 2.2 주요 개념

| 개념 | 설명 |
|------|------|
| **OAuth 2.0** | 제3자 애플리케이션이 사용자 대신 리소스에 접근할 수 있도록 하는 인증 프레임워크 |
| **Client ID** | Google에 등록된 애플리케이션 식별자 |
| **Client Secret** | 애플리케이션을 인증하기 위한 비밀 키 |
| **Redirect URI** | 인증 후 사용자를 돌려보낼 URL |
| **Scope** | 애플리케이션이 요청하는 권한 범위 (예: 이메일, 프로필) |
| **Access Token** | Google API에 접근할 수 있는 임시 토큰 |
| **ID Token** | 사용자 정보가 포함된 JWT 토큰 |

---

## 3. Google Auth Provider 장점

### 3.1 사용자 관점
- ✅ **편리성**: 별도 회원가입 없이 Google 계정으로 즉시 로그인
- ✅ **보안성**: Google의 강력한 보안 체계 활용
- ✅ **신뢰성**: 비밀번호를 제3자 사이트에 입력하지 않음

### 3.2 개발자 관점
- ✅ **구현 간소화**: 직접 인증 시스템 구축 불필요
- ✅ **유지보수 감소**: Google이 인증 인프라 관리
- ✅ **전환율 향상**: 간편한 로그인으로 회원가입 장벽 낮춤
- ✅ **보안 위험 감소**: 비밀번호 저장/관리 불필요

---

## 4. 필요한 정보

### 4.1 사용자로부터 받을 수 있는 정보

기본 정보 (동의 필수):
- 이메일 주소
- 이름 (성, 이름)
- 프로필 사진
- Google User ID

추가 정보 (사용자 동의 필요):
- 생년월일
- 성별
- 언어 설정
- 기타 Google 서비스 데이터

### 4.2 Scope 예시

```
openid                    # 기본 OpenID 인증
email                     # 이메일 주소
profile                   # 기본 프로필 정보 (이름, 사진)
```

---

## 5. 직접 구현 vs Clerk 사용

### 5.1 직접 구현 (Google OAuth 2.0)

**필요한 작업**:
1. Google Cloud Console에서 OAuth 2.0 클라이언트 생성
2. Client ID, Client Secret 발급
3. Redirect URI 설정
4. 프론트엔드에서 Google 로그인 버튼 구현
5. 백엔드에서 인증 코드 → 액세스 토큰 교환
6. 사용자 정보 조회 API 호출
7. 세션 관리 구현
8. 토큰 갱신 로직 구현

**장점**: 완전한 제어권
**단점**: 복잡한 구현, 유지보수 부담

### 5.2 Clerk 사용

**필요한 작업**:
1. Clerk Dashboard에서 Google 활성화 (클릭 한 번)
2. Clerk 컴포넌트 추가 (`<SignInButton>`)

**장점**:
- ✅ 5분 내 구현 완료
- ✅ 세션 관리 자동화
- ✅ 보안 업데이트 자동 적용
- ✅ 추가 Provider 쉽게 추가 가능

**단점**: Clerk 서비스 의존성

---

## 6. 보안 고려사항

### 6.1 CSRF 방지
- `state` 매개변수로 요청 검증
- 세션과 연결된 고유 값 사용

### 6.2 토큰 보안
- Access Token은 서버에서만 사용
- Client Secret은 절대 클라이언트 노출 금지
- HTTPS 필수 사용

### 6.3 Redirect URI 검증
- Google Console에 정확한 Redirect URI 등록
- 와일드카드 사용 지양

---

## 7. 일반적인 흐름 요약

### 사용자가 보는 화면
```
1. "Google로 로그인" 버튼
2. Google 로그인 팝업/페이지
3. "앱에 권한 허용" 동의 화면
4. 로그인 완료 후 원래 페이지로 복귀
```

### 개발자가 처리하는 작업 (Clerk 사용 시)
```
1. Clerk SDK 설치
2. Google Provider 활성화 (Dashboard)
3. <SignInButton> 컴포넌트 추가
4. Webhook으로 사용자 정보 동기화 (선택)
```

---

## 8. 핵심 용어 정리

| 용어 | 설명 |
|------|------|
| **Provider** | 인증 서비스를 제공하는 주체 (Google, Facebook 등) |
| **OAuth 2.0** | 표준 인증 프로토콜 |
| **OpenID Connect** | OAuth 2.0 기반 인증 레이어 |
| **JWT** | JSON Web Token, 사용자 정보를 담은 암호화된 토큰 |
| **PKCE** | 모바일/SPA를 위한 보안 강화 OAuth 플로우 |

---

## 9. 참고 자료

- [Google Identity Platform](https://developers.google.com/identity)
- [OAuth 2.0 개요](https://oauth.net/2/)
- [OpenID Connect](https://openid.net/connect/)
- [Clerk Google OAuth](https://clerk.com/docs/authentication/social-connections/google)
