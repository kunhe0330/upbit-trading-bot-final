
  # Upbit ETH Auto Trading Bot v2.1

  🎯 완전 자동화된 이더리움 매매 봇 시스템

  ## ✨ 주요 기능

  - 🚀 **24시간 자동매매** (Oracle Cloud VM)
  - 📊 **복합 기술지표** (RSI + MACD + Bollinger Bands + Supertrend)
  - 🧠 **스마트 적응형 매도** (40% 또는 최소 0.001 ETH)
  - 📡 **TradingView 웹훅** 연동
  - 📈 **실시간 모니터링** (/status, /logs, /backtest)
  - 🧪 **백테스팅 시스템** 및 전략 최적화
  - ⚡ **안정적 API 에러 처리**

  ## 🛠 설치 및 실행

  ```bash
  npm install
  export UPBIT_ACCESS_KEY="your_access_key"
  export UPBIT_SECRET_KEY="your_secret_key"
  npm start

  🌐 API 엔드포인트

  - GET /status - 시스템 상태 확인
  - GET /logs - 거래 로그 조회
  - GET /backtest - 백테스트 결과 조회
  - POST /backtest/run - 백테스트 실행
  - POST / - TradingView 웹훅 (BUY/EXIT_LONG)

  📊 백테스트 실행

  npm run backtest

  🎯 TradingView 웹훅 설정

  URL: http://your-server/
  Body: {"action": "BUY"} 또는 {"action": "EXIT_LONG"}
