  const express = require('express');
  const jwt = require('jsonwebtoken');
  const crypto = require('crypto');
  const axios = require('axios');

  const app = express();
  const PORT = process.env.PORT || 80;

  app.use(express.json());

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

    async placeBuyOrder(market, price) {
      const orderParams = {
        market: market,
        side: 'bid',
        ord_type: 'price',
        price: price.toString()
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

      const buyAmount = Math.floor(krwBalance * 0.1);

      if (buyAmount < 5000) {
        throw new Error(`잔고 부족: ${buyAmount}원 (최소 5000원)`);
      }

      const result = await this.api.placeBuyOrder('KRW-ETH', buyAmount);
      console.log('매수 완료:', result);

      return { success: true, orderId: result.uuid, amount: buyAmount };
    }
  }

  app.get('/', (req, res) => {
    res.json({
      status: 'healthy',
      message: 'Upbit ETH Trading Bot is ready',
      timestamp: new Date().toISOString()
    });
  });

  app.post('/', async (req, res) => {
    try {
      console.log('웹훅 수신:', req.body);

      if (req.body.action !== 'BUY') {
        return res.status(400).json({ error: '유효하지 않은 액션' });
      }

      const engine = new TradingEngine();
      const result = await engine.executeBuy();

      res.json({
        success: true,
        result: result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('웹훅 처리 실패:', error);
      res.status(500).json({
        error: '서버 오류',
        message: error.message
      });
    }
  });

  app.listen(PORT, () => {
    console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
  });
