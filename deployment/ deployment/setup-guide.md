  # 배포 가이드

  ## Oracle Cloud VM 설정
  1. Ubuntu 20.04 인스턴스 생성
  2. IP: 144.24.86.36 (고정 IP)
  3. SSH 키: ssh-key-2025-09-01.key

  ## 서버 설정 명령어
  ```bash
  # 패키지 설치
  sudo apt update
  sudo apt install -y nodejs npm

  # 프로젝트 복사
  git clone [your-repo-url]
  cd upbit-trading-bot
  npm install

  # 방화벽 설정 (iptables)
  sudo iptables -I INPUT 5 -p tcp --dport 80 -j ACCEPT
  sudo iptables -I INPUT 5 -p tcp --dport 5000 -j ACCEPT
  sudo iptables -I INPUT 5 -p tcp --dport 8080 -j ACCEPT
  sudo iptables-save | sudo tee /etc/iptables/rules.v4 > /dev/null

  # 서비스 등록
  sudo cp deployment/systemd-service.txt /etc/systemd/system/upbit-trading.service
  # API 키를 실제 값으로 수정 후:
  sudo systemctl daemon-reload
  sudo systemctl enable upbit-trading.service
  sudo systemctl start upbit-trading.service

  Oracle Cloud 보안 그룹

  - 포트 22, 80, 5000, 8080, ICMP 오픈

  업비트 API 설정

  - 허용 IP: 144.24.86.36
  - 권한: 거래 권한 포함
