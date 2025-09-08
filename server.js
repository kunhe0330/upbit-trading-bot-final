
  const express = require('express');
  const jwt = require('jsonwebtoken');
  const crypto = require('crypto');
  const axios = require('axios');

  const app = express();
  const PORT = process.env.PORT || 80;

  app.use(express.json());

  // 설정값
  const CONFIG = {
    BUY_PERCENTAGE: 0.1,  // KRW 잔고의 10%
    SELL_PERCENTAGE: 0.4, // ETH 보유량의 40% (기본값)
    MIN_ORDER_AMOUNT: 5000,
    MIN_ETH_AMOUNT: 0.001, // 최소 ETH 거래량 (약 4,000원)
    TRADING_SYMBOL: 'KRW-ETH'
  };

  class UpbitAPI {
    constructor() {
      this.accessKey = process.env.UPBIT_ACCESS_KEY;
      this.secretKey = process.env.UPBIT_SECRET_KEY;
      this.baseUrl = 'https://api.upbit.com';
    }

    generateJWT(queryHash = null) {
      const payload = {
        access_key: this.accessKey,
        nonce: crypto.randomUUID()
      };

      if (queryHash) {
        payload.query_hash = queryHash;
        payload.query_hash_alg = 'SHA512';
      }

      return jwt.sign(payload, this.secretKey, { algorithm: 'HS512' });
    }

    async makeRequest(method, endpoint, params = {}, requiresAuth = false) {
      let url = `${this.baseUrl}${endpoint}`;
      let headers = { 'Content-Type': 'application/json' };
      let data = null;

      if (requiresAuth) {
        let queryString = '';
        if (Object.keys(params).length > 0) {
          queryString = Object.keys(params)
            .map(key => `${key}=${encodeURIComponent(params[key])}`)
            .join('&');

          if (method === 'GET') {
            url += `?${queryString}`;
          } else {
            data = params;
          }
        }

        const queryHash = queryString ?
          crypto.createHash('sha512').update(queryString).digest('hex') : null;

        headers['Authorization'] = `Bearer ${this.generateJWT(queryHash)}`;
      }

      const response = await axios({ method, url, headers, data });
      return response.data;
    }

    async getKrwBalance() {
      const accounts = await this.makeRequest('GET', '/v1/accounts', {}, true);
      const krwAccount = accounts.find(account => account.currency === 'KRW');
      return krwAccount ? parseFloat(krwAccount.balance) : 0;
    }

    async getEthBalance() {
      const accounts = await this.makeRequest('GET', '/v1/accounts', {}, true);
      const ethAccount = accounts.find(account => account.currency === 'ETH');
      return ethAccount ? parseFloat(ethAccount.balance) : 0;
    }

    async getCurrentPrice(symbol) {
      const data = await this.makeRequest('GET', '/v1/ticker', { markets: symbol });
      return parseFloat(data[0].trade_price);
    }

    async placeBuyOrder(market, price) {
      const orderParams = {
        market: market,
        side: 'bid',
        ord_type: 'price',
        price: price.toString()
      };

      return await this.makeRequest('POST', '/v1/orders', orderParams, true);
    }

    async placeSellOrder(market, volume) {
      const orderParams = {
        market: market,
        side: 'ask',
        ord_type: 'market',
        volume: volume.toString()
      };

      return await this.makeRequest('POST', '/v1/orders', orderParams, true);
    }
  }

  class TradingEngine {
    constructor() {
      this.api = new UpbitAPI();
    }

    async executeBuy() {
      console.log('매수 실행 시작');

      const krwBalance = await this.api.getKrwBalance();
      console.log('KRW 잔고:', krwBalance);

      const buyAmount = Math.floor(krwBalance * CONFIG.BUY_PERCENTAGE);

      if (buyAmount < CONFIG.MIN_ORDER_AMOUNT) {
        throw new Error(`잔고 부족: ${buyAmount}원 (최소 ${CONFIG.MIN_ORDER_AMOUNT}원)`);
      }

      const result = await this.api.placeBuyOrder(CONFIG.TRADING_SYMBOL, buyAmount);
      console.log('매수 완료:', result);

      return {
        success: true,
        orderId: result.uuid,
        amount: buyAmount,
        type: 'BUY'
      };
    }

    async executeSell() {
      console.log('스마트 적응형 매도 실행 시작');

      const ethBalance = await this.api.getEthBalance();
      console.log('ETH 잔고:', ethBalance);

      if (ethBalance <= 0) {
        throw new Error('매도할 ETH가 없습니다');
      }

      // 1. 40% 매도량 계산
      const preferredSellAmount = ethBalance * CONFIG.SELL_PERCENTAGE;
      console.log(`희망 매도량 (40%): ${preferredSellAmount} ETH`);

      // 2. 현재 ETH 가격 조회
      const ethPrice = await this.api.getCurrentPrice(CONFIG.TRADING_SYMBOL);
      const preferredSellValue = preferredSellAmount * ethPrice;
      console.log(`희망 매도금액: ${Math.floor(preferredSellValue)}원`);

      let sellAmount, sellPercentage, sellStrategy;

      // 3. 적응형 로직: 40%가 최소 거래량 이상인지 체크
      if (preferredSellValue >= CONFIG.MIN_ORDER_AMOUNT) {
        // 40% 매도 가능
        sellAmount = preferredSellAmount;
        sellPercentage = '40%';
        sellStrategy = '정상 40% 매도';
      } else {
        // 최소 거래량만 매도
        sellAmount = CONFIG.MIN_ETH_AMOUNT;
        const actualPercentage = (sellAmount / ethBalance) * 100;
        sellPercentage = `${Math.round(actualPercentage)}%`;
        sellStrategy = '최소 거래량 매도';

        if (sellAmount > ethBalance) {
          sellAmount = ethBalance;
          sellPercentage = '100%';
          sellStrategy = '전량 매도 (잔고 부족)';
        }
      }

      // 소수점 8자리로 반올림
      const sellAmountRounded = Math.floor(sellAmount * 100000000) / 100000000;
      console.log(`매도 전략: ${sellStrategy}`);
      console.log(`최종 매도량: ${sellAmountRounded} ETH (${sellPercentage})`);

      const result = await this.api.placeSellOrder(CONFIG.TRADING_SYMBOL, sellAmountRounded);
      console.log('매도 완료:', result);

      return {
        success: true,
        orderId: result.uuid,
        amount: sellAmountRounded,
        type: 'SELL',
        percentage: sellPercentage,
        strategy: sellStrategy,
        ethPrice: Math.floor(ethPrice)
      };
    }
  }

  app.get('/', (req, res) => {
    res.json({
      status: 'healthy',
      message: 'Upbit ETH Trading Bot v2.1 - 스마트 적응형 매도',
      config: {
        buyPercentage: `${CONFIG.BUY_PERCENTAGE * 100}%`,
        sellPercentage: `${CONFIG.SELL_PERCENTAGE * 100}% (적응형)`,
        minOrderAmount: `${CONFIG.MIN_ORDER_AMOUNT}원`,
        minEthAmount: `${CONFIG.MIN_ETH_AMOUNT} ETH`
      },
      timestamp: new Date().toISOString()
    });
  });

  app.post('/', async (req, res) => {
    try {
      console.log('웹훅 수신:', req.body);
      const { action } = req.body;

      const engine = new TradingEngine();
      let result;

      switch (action) {
        case 'BUY':
          result = await engine.executeBuy();
          break;

        case 'EXIT_LONG':
          result = await engine.executeSell();
          break;

        default:
          return res.status(400).json({
            error: '지원하지 않는 액션',
            supportedActions: ['BUY', 'EXIT_LONG']
          });
      }

      res.json({
        success: true,
        action: action,
        result: result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('웹훅 처리 실패:', error);
      res.status(500).json({
        error: '서버 오류',
        message: error.message,
        action: req.body.action
      });
    }
  });

  app.listen(PORT, () => {
    console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
    console.log(`매수: ${CONFIG.BUY_PERCENTAGE * 100}%, 매도: ${CONFIG.SELL_PERCENTAGE * 100}% (스마트 적응형)`);
  });
