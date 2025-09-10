
  const axios = require('axios');

  class SimpleBacktest {
    constructor() {
      this.initialBalance = 1000000;
      this.krw = 1000000;
      this.eth = 0;
      this.trades = [];
      this.buyPercentage = 0.1;
      this.sellPercentage = 0.4;
    }

    async fetchCandles(count = 100) {
      try {
        const response = await axios.get('https://api.upbit.com/v1/candles/minutes/240', {
          params: { market: 'KRW-ETH', count: count }
        });
        return response.data.reverse();
      } catch (error) {
        console.error('데이터 조회 실패:', error.message);
        return [];
      }
    }

    calculateRSI(prices, period = 14) {
      if (prices.length < period + 1) return 50;

      let gains = 0;
      let losses = 0;

      for (let i = 1; i <= period; i++) {
        const change = prices[i] - prices[i - 1];
        if (change > 0) gains += change;
        else losses -= change;
      }

      const avgGain = gains / period;
      const avgLoss = losses / period;
      const rs = avgGain / avgLoss;
      return 100 - (100 / (1 + rs));
    }

    simulateTrade(candles) {
      let totalTrades = 0;

      for (let i = 20; i < candles.length; i++) {
        const currentPrice = candles[i].trade_price;
        const recentPrices = candles.slice(i - 20, i).map(c => c.trade_price);
        const rsi = this.calculateRSI(recentPrices);

        // 매수 조건: RSI < 40
        if (rsi < 40 && this.krw >= 50000) {
          const buyAmount = this.krw * this.buyPercentage;
          const ethBought = buyAmount / currentPrice;

          this.krw -= buyAmount;
          this.eth += ethBought;
          totalTrades++;

          this.trades.push({
            type: 'BUY',
            price: currentPrice,
            amount: ethBought,
            timestamp: candles[i].candle_date_time_utc,
            rsi: rsi
          });

          console.log('매수:', ethBought.toFixed(6), 'ETH @', currentPrice.toLocaleString(), '원, RSI:',
  rsi.toFixed(1));
        }

        // 매도 조건: RSI > 65
        if (rsi > 65 && this.eth >= 0.001) {
          const sellAmount = this.eth * this.sellPercentage;
          const krwReceived = sellAmount * currentPrice;

          this.eth -= sellAmount;
          this.krw += krwReceived;
          totalTrades++;

          this.trades.push({
            type: 'SELL',
            price: currentPrice,
            amount: sellAmount,
            timestamp: candles[i].candle_date_time_utc,
            rsi: rsi
          });

          console.log('매도:', sellAmount.toFixed(6), 'ETH @', currentPrice.toLocaleString(), '원, RSI:',
  rsi.toFixed(1));
        }
      }

      return totalTrades;
    }

    async runBacktest() {
      console.log('=== ETH 백테스팅 시작 ===');
      console.log('초기 자금:', this.initialBalance.toLocaleString(), '원');

      const candles = await this.fetchCandles(200);
      if (candles.length === 0) return;

      const totalTrades = this.simulateTrade(candles);

      const finalPrice = candles[candles.length - 1].trade_price;
      const initialPrice = candles[20].trade_price;

      const finalValue = this.krw + (this.eth * finalPrice);
      const totalReturn = ((finalValue - this.initialBalance) / this.initialBalance) * 100;
      const holdReturn = ((finalPrice - initialPrice) / initialPrice) * 100;

      console.log('\n=== 백테스트 결과 ===');
      console.log('기간:', candles.length - 20, '개 캔들');
      console.log('총 거래 횟수:', totalTrades);
      console.log('최종 KRW:', Math.floor(this.krw).toLocaleString(), '원');
      console.log('최종 ETH:', this.eth.toFixed(6));
      console.log('ETH 가치:', Math.floor(this.eth * finalPrice).toLocaleString(), '원');
      console.log('총 포트폴리오 가치:', Math.floor(finalValue).toLocaleString(), '원');
      console.log('전략 수익률:', totalReturn.toFixed(2), '%');
      console.log('단순 보유 수익률:', holdReturn.toFixed(2), '%');
      console.log('초과 수익률:', (totalReturn - holdReturn).toFixed(2), '%');

      return {
        finalValue: finalValue,
        totalReturn: totalReturn,
        holdReturn: holdReturn,
        trades: this.trades
      };
    }
  }

  module.exports = SimpleBacktest;
