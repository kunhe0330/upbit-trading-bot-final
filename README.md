  # Upbit ETH Trading Bot

  업비트 이더리움 자동매수 봇

  ## 기능
  - TradingView 웹훅 연동
  - KRW 잔고의 10% 자동 매수
  - Oracle Cloud 무료 인스턴스 배포
  - 24시간 자동 운영

  ## 설정
  1. 업비트 API 키 발급 (IP: 144.24.86.36)
  2. TradingView 웹훅: http://144.24.86.36/
  3. 메시지: {"action":"BUY"}

  ## 서비스 관리
  - 시작: sudo systemctl start upbit-trading.service
  - 중지: sudo systemctl stop upbit-trading.service
  - 상태: sudo systemctl status upbit-trading.service
