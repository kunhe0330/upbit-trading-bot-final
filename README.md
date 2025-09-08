
  # Upbit ETH Trading Bot v2.1

  업비트 이더리움 스마트 적립식 자동매매 봇

  ## 새로운 기능 (v2.1)
  - 🧠 **스마트 적응형 매도**: 40% 우선, 최소량 대체
  - 📊 **인디케이터 연동**: BUY/EXIT_LONG 액션 지원
  - 💰 **실시간 가격 조회**: 매도 전 ETH 가격 확인
  - 🎯 **부분 매도**: 매번 ETH 20% 누적 보유

  ## 매매 로직
  - **매수 신호**: KRW 잔고의 10%로 ETH 매수
  - **매도 신호**:
    - ETH 보유량 40% 매도 (5,000원 이상 시)
    - 최소 거래량 매도 (5,000원 미만 시)

  ## 설정
  1. 업비트 API 키 발급 (거래 권한, IP: 144.24.86.36)
  2. 환경변수 설정:
     - UPBIT_ACCESS_KEY
     - UPBIT_SECRET_KEY
     - PORT=80

  ## TradingView 웹훅
  - **URL**: http://144.24.86.36/
  - **매수 신호**: {"action":"BUY"}
  - **매수 청산**: {"action":"EXIT_LONG"}

  ## 인디케이터 연동
  통합 스코어링 전략 v2.0과 완벽 연동:
  - buySignal → BUY 액션
  - longExitSignal → EXIT_LONG 액션

  ## 서비스 관리
  ```bash
  # 상태 확인
  sudo systemctl status upbit-trading.service

  # 재시작
  sudo systemctl restart upbit-trading.service

  # 로그 확인
  journalctl -u upbit-trading.service -f

  아키텍처

  - 플랫폼: Oracle Cloud Always Free
  - OS: Ubuntu 20.04
  - 런타임: Node.js 20
  - 자동시작: systemd 서비스
