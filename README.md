## 리뷰맵(RevoiewMap)
- 구승민, 이유찬

### 제작시간
- 20시간
  - 8주간 주 2~3시간 개발
    - `2025-01-02` ~ `2025-02-28`

### 배경
- 해외 여행 시 여러 식당의 정보를 한번에 알아보기 힘들었음
- 각 지역별 정보가 해당 지역 언어로 구성되어 있어서 번역의 불편함을 느낌
- 이러한 문제를 해결하고자 LLM과 Google Map을 활용한 솔루션 제작

### 기능
- 구글 맵 API 활용을 통한 전세계 식당 정보를 한국어로 요약
- LLM모델을 활용하여 정확하고 유용한 식당을 알 수 있음
- 지도에 마커를 통한 해당 식당 이름 및 위치 정보 제공
- '현위치 검색' 기능으로 편의성 향상

### 개발 스택
- Front & Back
  - SvelteKit
- LLM Server
  - LM Studio
- AI Model
  - exaone-3.5-7.8b-instruct

### 구현 결과

![스크린샷_21-3-2025_223927_localhost](https://github.com/user-attachments/assets/798af66c-e763-4305-ae78-3ff05a19ad8d)

---

![스크린샷_21-3-2025_22417_localhost](https://github.com/user-attachments/assets/4cd7b37f-4ae3-48c4-b96a-e04c7fe337fc)

---

![image](https://github.com/user-attachments/assets/82af53e6-eb10-443f-b7a0-1986287dd69d)
