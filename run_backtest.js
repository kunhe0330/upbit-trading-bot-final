
  const SimpleBacktest = require('./simple_backtest');

  async function main() {
    const backtest = new SimpleBacktest();
    const results = await backtest.runBacktest();

    // 결과를 JSON 파일로 저장
    const fs = require('fs');
    fs.writeFileSync('./backtest_results.json', JSON.stringify({
      timestamp: new Date().toISOString(),
      results: results,
      summary: {
        finalValue: Math.floor(results.finalValue),
        totalReturn: results.totalReturn.toFixed(2) + '%',
        holdReturn: results.holdReturn.toFixed(2) + '%',
        outperformance: (results.totalReturn - results.holdReturn).toFixed(2) + '%',
        totalTrades: results.trades.length
      }
    }, null, 2));

    console.log('백테스트 결과가 backtest_results.json 파일에 저장되었습니다.');
  }

  main().catch(console.error);
