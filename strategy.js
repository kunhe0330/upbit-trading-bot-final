
  const TechnicalIndicators = require('./indicators');

  class IntegratedScoringStrategy {
    constructor(config = {}) {
      this.config = {
        st_atrPeriod: config.st_atrPeriod || 10,
        st_factor: config.st_factor || 3.0,
        rsi_period: config.rsi_period || 14,
        rsi_buy_level: config.rsi_buy_level || 40.0,
        rsi_sell_level: config.rsi_sell_level || 60.0,
        macd_fast_len: config.macd_fast_len || 12,
        macd_slow_len: config.macd_slow_len || 26,
        macd_signal_len: config.macd_signal_len || 9,
        bb_period: config.bb_period || 20,
        bb_stddev: config.bb_stddev || 2.0,
        score_threshold: config.score_threshold || 2
      };

      this.candleData = {
        high: [],
        low: [],
        close: [],
        volume: []
      };
    }

    addCandle(high, low, close, volume) {
      this.candleData.high.push(parseFloat(high));
      this.candleData.low.push(parseFloat(low));
      this.candleData.close.push(parseFloat(close));
      this.candleData.volume.push(parseFloat(volume));

      if (this.candleData.close.length > 200) {
        this.candleData.high.shift();
        this.candleData.low.shift();
        this.candleData.close.shift();
        this.candleData.volume.shift();
      }
    }

    analyzeSignal() {
      const analysis = this.analyze();

      if (analysis.buySignal) {
        return {
          action: 'BUY',
          score: analysis.indicators?.buy_score || 0,
          details: analysis.indicators
        };
      } else if (analysis.longExitSignal) {
        return {
          action: 'SELL',
          score: analysis.indicators?.sell_score || 0,
          details: analysis.indicators
        };
      } else {
        return {
          action: 'HOLD',
          score: 0,
          details: analysis.indicators
        };
      }
    }

    analyze() {
      const dataLength = this.candleData.close.length;
      if (dataLength < 50) {
        return { buySignal: false, sellSignal: false, longExitSignal: false, message: '데이터 부족' };
      }

      try {
        const { direction } = TechnicalIndicators.calculateSupertrend(
          this.candleData.high, this.candleData.low, this.candleData.close,
          this.config.st_atrPeriod, this.config.st_factor
        );

        const rsi = TechnicalIndicators.calculateRSI(this.candleData.close, this.config.rsi_period);
        const { macdLine, signalLine } = TechnicalIndicators.calculateMACD(
          this.candleData.close, this.config.macd_fast_len, this.config.macd_slow_len, this.config.macd_signal_len
        );
        const { upper: bb_upper, lower: bb_lower } = TechnicalIndicators.calculateBollingerBands(
          this.candleData.close, this.config.bb_period, this.config.bb_stddev
        );

        const currentIdx = dataLength - 1;

        if (currentIdx < 2 || !rsi[currentIdx] || !macdLine[currentIdx] || !signalLine[currentIdx]) {
          return { buySignal: false, sellSignal: false, longExitSignal: false, message: '지표 데이터 부족' };
        }

        // 매수 조건
        const rsi_buy_cond = this.checkCrossover(rsi, this.config.rsi_buy_level, currentIdx);
        const macd_buy_cond = this.checkMACDCrossover(macdLine, signalLine, currentIdx, true);
        const bb_buy_cond = this.candleData.close[currentIdx] <= bb_lower[currentIdx];

        const buy_score = (rsi_buy_cond ? 1 : 0) + (macd_buy_cond ? 1 : 0) + (bb_buy_cond ? 1 : 0);
        const buySignal = direction[currentIdx] > 0 && buy_score >= this.config.score_threshold;

        // 매도 조건
        const rsi_sell_cond = this.checkCrossunder(rsi, this.config.rsi_sell_level, currentIdx);
        const macd_sell_cond = this.checkMACDCrossover(macdLine, signalLine, currentIdx, false);
        const bb_sell_cond = this.candleData.close[currentIdx] >= bb_upper[currentIdx];

        const sell_score = (rsi_sell_cond ? 1 : 0) + (macd_sell_cond ? 1 : 0) + (bb_sell_cond ? 1 : 0);
        const sellSignal = direction[currentIdx] < 0 && sell_score >= this.config.score_threshold;

        return {
          buySignal,
          sellSignal: false,
          longExitSignal: sellSignal,
          indicators: {
            rsi: rsi[currentIdx],
            macd: macdLine[currentIdx],
            direction: direction[currentIdx],
            buy_score,
            sell_score
          },
          message: 'OK'
        };

      } catch (error) {
        return { buySignal: false, sellSignal: false, longExitSignal: false, message: `오류: ${error.message}` };
      }
    }

    checkCrossover(series, level, currentIdx) {
      if (currentIdx < 1) return false;
      return series[currentIdx - 1] <= level && series[currentIdx] > level;
    }

    checkCrossunder(series, level, currentIdx) {
      if (currentIdx < 1) return false;
      return series[currentIdx - 1] >= level && series[currentIdx] < level;
    }

    checkMACDCrossover(macdLine, signalLine, currentIdx, isUpward) {
      if (currentIdx < 1) return false;
      const prevMacd = macdLine[currentIdx - 1];
      const currMacd = macdLine[currentIdx];
      const prevSignal = signalLine[currentIdx - 1];
      const currSignal = signalLine[currentIdx];

      if (isUpward) {
        return prevMacd <= prevSignal && currMacd > currSignal;
      } else {
        return prevMacd >= prevSignal && currMacd < currSignal;
      }
    }
  }

  module.exports = IntegratedScoringStrategy;
