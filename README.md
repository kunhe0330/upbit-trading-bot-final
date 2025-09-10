
  # Upbit ETH Auto Trading Bot v2.1 🚀

  완전 자동화된 이더리움 매매 봇 시스템 with 복합 기술지표 분석

  ## ✨ 주요 기능

  - 🚀 **24시간 자동매매** (Oracle Cloud VM에서 실행)
  - 📊 **복합 기술지표 분석** (RSI + MACD + Bollinger Bands + Supertrend)
  - 🧠 **스마트 적응형 매도** (40% 또는 최소 0.001 ETH)
  - 📡 **TradingView 웹훅** 연동 지원
  - 📈 **실시간 모니터링** (/status, /logs, /backtest)
  - 🧪 **백테스팅 시스템** 및 전략 최적화
  - ⚡ **안정적 API 에러 처리** 및 재시도 로직

  ## 📁 파일 구조

  ### 핵심 파일들
  upbit-trading-bot/
  ├── server.js              # 메인 자동매매 서버
  ├── indicators.js           # 기술지표 계산 엔진 (RSI, MACD, BB, Supertrend)
  ├── strategy.js             # 복합 전략 로직 (점수 기반 매매 결정)
  ├── simple_backtest.js      # 백테스팅 시스템
  ├── run_backtest.js         # 백테스트 실행 스크립트
  ├── package.json            # 의존성 및 스크립트
  └── README.md              # 이 문서

  ### 핵심 모듈 설명

  #### 🔢 **indicators.js** - 기술지표 계산 엔진
  - RSI (Relative Strength Index) 계산
  - MACD (Moving Average Convergence Divergence) 계산
  - Bollinger Bands (볼린저 밴드) 계산
  - Supertrend (슈퍼트렌드) 계산
  - ATR, SMA, EMA 등 보조지표
  - Crossover/Crossunder 신호 감지

  #### 🎯 **strategy.js** - 복합 전략 로직
  - 점수 기반 매매 신호 생성 (임계값: 2점 이상)
  - 매수 조건: RSI < 40 + MACD 골든크로스 + BB 하단 + Supertrend 상승
  - 매도 조건: RSI > 60 + MACD 데드크로스 + BB 상단 + Supertrend 하락
  - 실시간 캔들 데이터 관리 (최대 200개 유지)

  ## 🛠 설치 및 실행

  ### 1. 의존성 설치
  ```bash
  npm install

  2. 환경 변수 설정

  export UPBIT_ACCESS_KEY="your_access_key"
  export UPBIT_SECRET_KEY="your_secret_key"
  export PORT=80

  3. 서버 실행

  npm start

  🌐 API 엔드포인트

  실시간 모니터링

  - GET / - 시스템 정보 및 설정값
  - GET /status - 실시간 시스템 상태
  - GET /logs?limit=20 - 거래 로그 조회

  백테스팅

  - GET /backtest - 백테스트 결과 조회
  - POST /backtest/run - 새 백테스트 실행

  TradingView 웹훅

  - POST / - 매매 신호 수신
    - Body: {"action": "BUY"} - 매수 신호
    - Body: {"action": "EXIT_LONG"} - 매도 신호

  📊 백테스팅 시스템

  백테스트 실행

  npm run backtest

  전략 최적화

  백테스트 결과를 통해 RSI, MACD 등 파라미터 최적화 가능

  결과 분석

  - 전략 수익률 vs 단순 보유 수익률 비교
  - 거래 횟수 및 승률 분석
  - JSON 파일로 상세 결과 저장

  🎯 TradingView 연동

  웹훅 URL 설정

  http://your-server-ip/

  알림 메시지 설정

  매수 신호:
  {"action": "BUY"}

  매도 신호:
  {"action": "EXIT_LONG"}

  ⚙️ 설정 커스터마이징

  server.js 설정값

  const CONFIG = {
    BUY_PERCENTAGE: 0.1,      // KRW 잔고의 10% 매수
    SELL_PERCENTAGE: 0.4,     // ETH 보유량의 40% 매도
    MIN_ORDER_AMOUNT: 5000,   // 최소 주문 금액 (원)
    MIN_ETH_AMOUNT: 0.001,    // 최소 ETH 거래량
    TRADING_SYMBOL: 'KRW-ETH' // 거래 심볼
  };

  strategy.js 기술지표 설정

  const config = {
    st_atrPeriod: 10,         // Supertrend ATR 기간
    st_factor: 3.0,           // Supertrend 팩터
    rsi_period: 14,           // RSI 계산 기간
    rsi_buy_level: 40.0,      // RSI 매수 임계값
    rsi_sell_level: 60.0,     // RSI 매도 임계값
    macd_fast_len: 12,        // MACD 빠른 EMA
    macd_slow_len: 26,        // MACD 느린 EMA
    macd_signal_len: 9,       // MACD 신호선
    bb_period: 20,            // 볼린저밴드 기간
    bb_stddev: 2.0,           // 볼린저밴드 표준편차
    score_threshold: 2        // 매매 신호 임계 점수
  };

  🔒 보안 및 주의사항

  - API 키는 반드시 환경 변수로 관리
  - 실제 서버에서는 HTTPS 사용 권장
  - 정기적인 로그 모니터링 및 백업
  - 네트워크 오류 대비 재시도 로직 내장

  📈 성능 최적화

  - 실시간 캔들 데이터 효율적 관리
  - 메모리 사용량 최적화 (최대 200개 캔들)
  - API 호출 최소화 및 에러 처리 강화
  - 백테스트 병렬 처리 지원

  🎉 시스템 현황

  ✅ Oracle Cloud VM에서 24시간 안정적 운영 중✅ 복합 기술지표 기반 정교한 매매 시스템✅ 스마트 적응형 매도 로직으로
   리스크 관리✅ 실시간 모니터링 및 백테스팅 완비

  ---
  📞 지원

  이슈 리포팅: GitHub Issues업데이트: 정기적 기능 추가 및 최적화
