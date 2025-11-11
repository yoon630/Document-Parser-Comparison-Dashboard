# Document Parser Comparison Tool

## 프로젝트 소개

**Interex Document AI**와 **Upstage Document Parser** 두 문서 파싱 API의 성능과 결과를 비교 분석하는 웹 기반 도구입니다.

### 핵심 기능

1. **성능 분석**: 처리 시간을 네트워크 대기시간과 순수 처리시간으로 분리하여 측정
2. **파싱 결과 비교**: 표, 수식, 이미지 인식 결과를 시각적으로 비교
3. **다양한 출력 형식**: Text, HTML, JSON/Markdown 형식으로 결과 확인
4. **이미지 렌더링**: 인식된 이미지를 실제로 표시 (Base64 지원)
5. **수식 렌더링**: LaTeX 수식을 아름답게 렌더링 (KaTeX 사용)

---

## 분석 대상 API

- **Interex Document AI** ([https://console.interxlab.io](https://console.interxlab.io))
  - Interex사의 문서 AI 파싱 솔루션

- **Upstage Document Parser** ([https://console.upstage.ai](https://console.upstage.ai))
  - Upstage사의 문서 파싱 API

---

## 프로젝트 구조

```
parser-blackbox-analysis/
├── backend/                      # Node.js + Express 백엔드
│   ├── server.js                 # 메인 서버 (API 프록시)
│   ├── uploads/                  # 업로드된 파일 임시 저장
│   └── package.json
│
└── frontend/                     # React 프론트엔드
    ├── src/
    │   ├── components/
    │   │   └── ModelPanel.jsx    # 모델별 독립 패널
    │   ├── App.jsx
    │   └── index.css
    └── package.json
```

---

## 빠른 시작

### 1. 의존성 설치

```bash
# 백엔드
cd backend
npm install

# 프론트엔드 (새 터미널)
cd frontend
npm install
```

### 2. 서버 실행

#### 백엔드 서버 실행
```bash
cd backend
npm start
```
→ http://localhost:5001 에서 실행됩니다.

#### 프론트엔드 실행 (새 터미널)
```bash
cd frontend
npm run dev
```
→ http://localhost:3000 에서 실행됩니다.

### 3. 사용 방법

1. 브라우저에서 **http://localhost:3000** 접속
2. **좌측 패널 (Interex)**
   - API 키 입력 → 저장
   - 문서 파일 업로드
   - 실행 버튼 클릭
3. **우측 패널 (Upstage)**
   - API 키 입력 → 저장
   - 문서 파일 업로드
   - 실행 버튼 클릭
4. 결과 비교 및 분석

---

## 주요 기능 상세

### ⏱️ 시간 분석

각 API의 처리 시간을 다음과 같이 분석합니다:

- **총 소요시간**: 요청 전송부터 응답 수신까지 전체 시간
- **네트워크 대기시간 (Latency)**: 네트워크 통신에 소요된 시간
- **순수 처리시간 (Processing)**: 서버에서 실제 문서 처리에 소요된 시간

```
총 소요시간 = 네트워크 대기시간 + 순수 처리시간
```

### 📊 파싱 결과 분석

문서에서 인식된 요소들을 카테고리별로 분류하여 표시:

#### 1. 표 (Tables)
- 인식된 표의 개수 표시
- HTML 렌더링으로 표 구조 시각화
- 텍스트 형태로도 확인 가능

#### 2. 수식 (Formulas)
- LaTeX 코드와 렌더링된 수식을 동시에 표시
- KaTeX 라이브러리를 사용한 아름다운 수학 표현
- 원본 텍스트도 함께 제공

#### 3. 이미지 (Images/Figures)
- Base64 인코딩된 이미지를 실제 이미지로 표시
- 좌표 정보 (coordinates) 제공
- 이미지 메타데이터 확인 가능

### 📝 출력 형식

각 파서의 결과를 세 가지 탭으로 확인:

- **Text**: 순수 텍스트 추출 결과
- **HTML**: HTML 형식으로 구조화된 결과
- **JSON / Markdown**:
  - Interex: JSON 형식
  - Upstage: Markdown 형식

### 🔍 전체 응답 확인

각 API의 원본 응답(Raw Response)을 JSON 형태로 확인 가능하여 디버깅 및 상세 분석에 활용할 수 있습니다.

---

## 기술 스택

### 백엔드
- **Node.js** - 서버 런타임
- **Express** - 웹 프레임워크
- **Multer** - 파일 업로드 처리
- **Axios** - HTTP 클라이언트
- **Form-Data** - Multipart form 데이터 생성

### 프론트엔드
- **React 18** - UI 라이브러리
- **Vite** - 빌드 도구 및 개발 서버
- **Axios** - HTTP 클라이언트
- **KaTeX** - LaTeX 수식 렌더링

---

## API 엔드포인트

### Backend API

#### `POST /api/keys`
API 키 저장
```json
{
  "interexKey": "your-interex-api-key",
  "upstageKey": "your-upstage-api-key"
}
```

#### `GET /api/keys`
API 키 설정 상태 확인
```json
{
  "interexKeySet": true,
  "upstageKeySet": true
}
```

#### `POST /api/compare/interex`
Interex Document AI 호출
- **Content-Type**: `multipart/form-data`
- **Field**: `document` (file)
- **Returns**: 파싱 결과 및 시간 분석 데이터

#### `POST /api/compare/upstage`
Upstage Document Parser 호출
- **Content-Type**: `multipart/form-data`
- **Field**: `document` (file)
- **Returns**: 파싱 결과 및 시간 분석 데이터

---

## 응답 구조 예시

### 성공 응답
```json
{
  "filename": "document.pdf",
  "result": {
    "success": true,
    "extractedText": "...",
    "extractedHtml": "...",
    "extractedJson": "...",
    "structuredData": {...},
    "totalTime": 3542,
    "networkLatency": 125,
    "serverProcessingTime": 3417,
    "rawResponse": {...}
  }
}
```

### 에러 응답
```json
{
  "filename": "document.pdf",
  "result": {
    "success": false,
    "error": "Error message",
    "errorDetails": {...},
    "totalTime": 120000
  }
}
```

---

## 지원 파일 형식

### Interex Document AI
- PDF
- 이미지 (JPG, PNG 등)
- Office 문서 (DOC, DOCX, XLS, XLSX)

### Upstage Document Parser
- PDF
- 이미지 (JPG, PNG 등)
- Office 문서 (DOC, DOCX, XLS, XLSX)

---

## 개발 팁

### Hot Module Replacement (HMR)
- 프론트엔드는 Vite HMR 지원으로 코드 수정 시 자동 반영
- 백엔드는 수정 후 서버 재시작 필요

### API 키 관리
- API 키는 메모리에만 저장 (서버 재시작 시 재입력 필요)
- 보안을 위해 환경 변수 사용 권장

### 디버깅
- 백엔드 콘솔에서 상세한 API 응답 로그 확인
- 브라우저 개발자 도구 콘솔에서 프론트엔드 로그 확인
- 네트워크 탭에서 API 호출 내역 확인

---

## 알려진 이슈

### Interex API
- Layout Analysis 단계에서 간헐적 연결 오류 발생 가능
- HTTP 200 상태 코드로 에러 응답을 반환하는 경우 있음

### 해결 방법
- API 키가 올바른지 확인
- 파일 크기/형식 제한 확인
- 잠시 후 재시도

---

## 향후 개선 계획

- [ ] API 키 암호화 저장
- [ ] 결과 저장 및 히스토리 기능
- [ ] 여러 파일 동시 비교
- [ ] 테스트 케이스 관리
- [ ] 성능 벤치마크 통계

---

## 라이선스

MIT License

---

## 문의

프로젝트 관련 문의사항이나 버그 리포트는 이슈 페이지를 이용해주세요.
