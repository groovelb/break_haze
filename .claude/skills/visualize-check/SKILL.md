---
name: visualize-check
description: Visualizer 컴포넌트의 오디오 시각화 로직을 분석하고 개선점을 제안합니다
user-invocable: false
---

## 시각화 체크 가이드

Visualizer.tsx의 Canvas 렌더링을 분석할 때 확인할 사항:

### Thunder 모드 (Big Beat)
- `getByteFrequencyData` 사용 (주파수 도메인)
- acid-yellow (#ccff00) / neon-pink (#ff0099) 컬러
- 날카로운 재기드 라인 패턴
- 저주파 감지 시 화면 셰이크 (dataArray[10] > 200)
- trail opacity: 0.3 (빠른 갱신)

### Cloud 모드 (Trip-hop)
- `getByteTimeDomainData` 사용 (시간 도메인)
- deep-purple (#240046) 컬러 + 퍼플 글로우
- 부드러운 웨이브 패턴
- trail opacity: 0.05 (긴 잔상)
- shadowBlur 효과 적용

### 공통 체크포인트
- canvas resize 핸들러 등록/해제
- requestAnimationFrame 정리
- analyser null 체크 (idle 상태 처리)
- fftSize 설정 확인 (현재 256)
