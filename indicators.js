
  const stats = require('simple-statistics');

  class TechnicalIndicators {
    // ATR 계산
    static calculateATR(highs, lows, closes, period = 14) {
      const trValues = [];

      for (let i = 1; i < closes.length; i++) {
        const tr1 = highs[i] - lows[i];
        const tr2 = Math.abs(highs[i] - closes[i - 1]);
        const tr3 = Math.abs(lows[i] - closes[i - 1]);
        trValues.push(Math.max(tr1, tr2, tr3));
      }

      return this.simpleMovingAverage(trValues, period);
    }

    // 슈퍼트렌드 계산
    static calculateSupertrend(highs, lows, closes, atrPeriod = 10, factor = 3.0) {
      const atr = this.calculateATR(highs, lows, closes, atrPeriod);
      const hl2 = highs.map((high, i) => (high + lows[i]) / 2);

      const supertrend = [];
      const direction = [];

      for (let i = 0; i < closes.length; i++) {
        if (i < atrPeriod) {
          supertrend.push(null);
          direction.push(null);
          continue;
        }

        const currentATR = atr[i - atrPeriod + 1];
        const basicUpperband = hl2[i] + factor * currentATR;
        const basicLowerband = hl2[i] - factor * currentATR;

        // 현재는 간단한 버전으로 구현
        if (closes[i] <= basicLowerband) {
          direction.push(1);  // 상승
          supertrend.push(basicLowerband);
        } else if (closes[i] >= basicUpperband) {
          direction.push(-1); // 하락
          supertrend.push(basicUpperband);
        } else {
          direction.push(direction[i-1] || 1);
          supertrend.push(supertrend[i-1] || closes[i]);
        }
      }

      return { supertrend, direction };
    }

    // RSI 계산
    static calculateRSI(closes, period = 14) {
      const changes = [];
      for (let i = 1; i < closes.length; i++) {
        changes.push(closes[i] - closes[i - 1]);
      }

      const rsi = [];
      for (let i = 0; i < closes.length; i++) {
        if (i < period) {
          rsi.push(null);
          continue;
        }

        const gains = [];
        const losses = [];

        for (let j = i - period + 1; j <= i; j++) {
          const change = changes[j - 1];
          if (change > 0) {
            gains.push(change);
            losses.push(0);
          } else {
            gains.push(0);
            losses.push(Math.abs(change));
          }
        }

        const avgGain = stats.mean(gains);
        const avgLoss = stats.mean(losses);
        const rs = avgGain / avgLoss;
        const rsiValue = 100 - (100 / (1 + rs));

        rsi.push(rsiValue);
      }

      return rsi;
    }

    // MACD 계산
    static calculateMACD(closes, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
      const fastEMA = this.exponentialMovingAverage(closes, fastPeriod);
      const slowEMA = this.exponentialMovingAverage(closes, slowPeriod);

      const macdLine = [];
      for (let i = 0; i < closes.length; i++) {
        if (fastEMA[i] !== null && slowEMA[i] !== null) {
          macdLine.push(fastEMA[i] - slowEMA[i]);
        } else {
          macdLine.push(null);
        }
      }

      const signalLine = this.exponentialMovingAverage(macdLine.filter(val => val !== null), signalPeriod);
      const histLine = [];

      let signalIndex = 0;
      for (let i = 0; i < macdLine.length; i++) {
        if (macdLine[i] !== null && signalLine[signalIndex] !== undefined) {
          histLine.push(macdLine[i] - signalLine[signalIndex]);
          signalIndex++;
        } else {
          histLine.push(null);
        }
      }

      return { macdLine, signalLine, histLine };
    }

    // 볼린저 밴드 계산
    static calculateBollingerBands(closes, period = 20, stdDev = 2.0) {
      const sma = this.simpleMovingAverage(closes, period);
      const upper = [];
      const lower = [];

      for (let i = 0; i < closes.length; i++) {
        if (i < period - 1) {
          upper.push(null);
          lower.push(null);
          continue;
        }

        const slice = closes.slice(i - period + 1, i + 1);
        const std = stats.standardDeviation(slice);
        const middle = sma[i];

        upper.push(middle + stdDev * std);
        lower.push(middle - stdDev * std);
      }

      return { upper, middle: sma, lower };
    }

    // 단순 이동평균
    static simpleMovingAverage(values, period) {
      const sma = [];
      for (let i = 0; i < values.length; i++) {
        if (i < period - 1) {
          sma.push(null);
          continue;
        }

        const slice = values.slice(i - period + 1, i + 1);
        sma.push(stats.mean(slice));
      }
      return sma;
    }

    // 지수 이동평균
    static exponentialMovingAverage(values, period) {
      const ema = [];
      const multiplier = 2 / (period + 1);

      for (let i = 0; i < values.length; i++) {
        if (values[i] === null) {
          ema.push(null);
          continue;
        }

        if (i === 0 || ema[i - 1] === null) {
          ema.push(values[i]);
        } else {
          ema.push((values[i] - ema[i - 1]) * multiplier + ema[i - 1]);
        }
      }

      return ema;
    }

    // Crossover 감지
    static crossover(series1, series2) {
      const signals = [];
      for (let i = 1; i < series1.length; i++) {
        if (series1[i - 1] !== null && series1[i] !== null &&
            series2[i - 1] !== null && series2[i] !== null) {
          const prevBelow = series1[i - 1] <= series2[i - 1];
          const currentAbove = series1[i] > series2[i];
          signals.push(prevBelow && currentAbove);
        } else {
          signals.push(false);
        }
      }
      return signals;
    }

    // Crossunder 감지
    static crossunder(series1, series2) {
      const signals = [];
      for (let i = 1; i < series1.length; i++) {
        if (series1[i - 1] !== null && series1[i] !== null &&
            series2[i - 1] !== null && series2[i] !== null) {
          const prevAbove = series1[i - 1] >= series2[i - 1];
          const currentBelow = series1[i] < series2[i];
          signals.push(prevAbove && currentBelow);
        } else {
          signals.push(false);
        }
      }
      return signals;
    }
  }

  module.exports = TechnicalIndicators;
