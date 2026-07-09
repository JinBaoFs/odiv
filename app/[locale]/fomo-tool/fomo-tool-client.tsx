'use client';

import {useState, useRef, useEffect} from 'react';
import {useTranslations} from 'next-intl';
import {useTheme} from 'next-themes';
import * as echarts from 'echarts';

interface TableData {
  totalSupply: number;
  price: string;
  maxBNB: number;
  rate: number;
  fee: number;
  swapRate: number;
  lRate: number;
  dayCast: number;
  swapBuyToken: number;
  autoMarketBNB: number;
  lToken: number;
  serverFee: number;
  userPayBNB: number;
  lpTotals: number;
  tokenOutputTotals: number;
}

interface Results {
  prices: number[];
  nums: (number | string)[];
  rTokens: (number | string)[];
  Ks: (number | string)[];
  Xs: (number | string)[];
  Ys: (number | string)[];
  rates: string[];
  lps: (number | string)[];
  reports: (number | string)[];
  payBNBs: (number | string)[];
  ransomTokens: (number | string)[];
  ransomBNBs: (number | string)[];
  ransomTokensToBNB: (number | string)[];
  tokenOutputs: any[];
  dayRates: (string | number)[];
  lPayBNBs: (number | string)[];
  pieces: any[];
}

interface LPData {
  num: number;
  reports: number;
  payBNB: number;
  ransomTokens: number;
  ransomBNBs: number;
}

// 单价过大会导致所需铸造轮数暴涨，超过这个上限直接判定参数不合理并中止
const MAX_ITERATIONS = 10000;

export function FomoToolClient() {
  const t = useTranslations('fomoTool');

  const [tableData, setTableData] = useState<TableData>({
    totalSupply: 2800000000,
    price: '0.0000000119047',
    maxBNB: 1,
    rate: 0.3,
    fee: 0.01,
    swapRate: 0.1,
    lRate: 0.5,
    dayCast: 4,
    swapBuyToken: 0,
    autoMarketBNB: 0,
    lToken: 0,
    serverFee: 0,
    userPayBNB: 0,
    lpTotals: 0,
    tokenOutputTotals: 0,
  });

  const [results, setResults] = useState<Results>({
    prices: [],
    nums: [],
    rTokens: [],
    Ks: [],
    Xs: [],
    Ys: [],
    rates: [],
    lps: [],
    reports: [],
    payBNBs: [],
    ransomTokens: [],
    ransomBNBs: [],
    ransomTokensToBNB: [],
    tokenOutputs: [],
    dayRates: [],
    lPayBNBs: [],
    pieces: [],
  });

  const [lpData, setLpData] = useState<LPData>({
    num: 0,
    reports: 0,
    payBNB: 0,
    ransomTokens: 0,
    ransomBNBs: 0,
  });

  const [reportsIdx, setReportsIdx] = useState('');
  const [error, setError] = useState('');

  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);
  const chartArgsRef = useRef<{localResults: Results; currentPrice: number; initPrice: string} | null>(null);

  const {resolvedTheme} = useTheme();

  const getCssVar = (name: string) => {
    if (typeof document === 'undefined') return '';
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  };

  // 表单校验
  const validateFields = (): boolean => {
    const requiredFields: Record<string, string> = {
      totalSupply: t('form.totalSupply'),
      price: t('form.price'),
      maxBNB: t('form.maxBNB'),
      swapRate: t('form.swapRate'),
    };

    for (const [key, label] of Object.entries(requiredFields)) {
      const val = tableData[key as keyof TableData];
      if (!val || val === 0) {
        setError(t('validation.required', {field: label}));
        return false;
      }
    }

    setError('');
    return true;
  };

  // 计算涨幅%
  const calculateGrowthRate = (oldPrice: number, newPrice: number): string => {
    const growthRate = ((newPrice - oldPrice) / oldPrice) * 100;
    return growthRate.toFixed(2) + '%';
  };

  // 价格更新前数据添加
  const dateFormartUpdate = (obj: Partial<Results>) => {
    setResults((prev) => {
      const updated = {...prev};
      Object.entries(obj).forEach(([key, value]) => {
        if (Array.isArray(updated[key as keyof Results])) {
          updated[key as keyof Results] = [
            ...(updated[key as keyof Results] as any[]),
            value,
          ];
        }
      });
      return updated;
    });
  };

  // 代币认购创建（核心计算逻辑）
  const handleCreate = async () => {
    if (!validateFields()) return;

    setError('');

    // 用普通 JS 对象做循环计算，避免逐次 setState
    const localTableData: TableData = JSON.parse(JSON.stringify(tableData));
    const localResults: Results = {
      prices: [],
      nums: [],
      rTokens: [],
      Ks: [],
      Xs: [],
      Ys: [],
      rates: [],
      lps: [],
      reports: [],
      payBNBs: [],
      ransomTokens: [],
      ransomBNBs: [],
      ransomTokensToBNB: [],
      tokenOutputs: [],
      dayRates: [],
      lPayBNBs: [],
      pieces: [],
    };

    const {totalSupply: intTotalSupply, rate, maxBNB, fee, lRate, swapRate, dayCast} = tableData;
    const intPrice = parseFloat(tableData.price);

    let totalSupply = intTotalSupply * rate;
    let bBNB = (maxBNB - fee) * lRate;
    let price = intPrice;
    let preve_price = 0;
    let num = 0;
    let autoByNum = 0;
    let x = 0;
    let y = 0;
    let autoByRate = 0.015;
    let lastPayBNB = 0;
    let prev_totalSupply = 0;
    let prev_day_price = intPrice;

    localTableData.swapBuyToken = 0;
    localTableData.autoMarketBNB = 0;
    localTableData.lToken = 0;
    localTableData.serverFee = 0;
    localTableData.userPayBNB = 0;
    localTableData.lpTotals = 0;
    localTableData.tokenOutputTotals = 0;

    while (totalSupply > 0) {
      if (num >= MAX_ITERATIONS) {
        setError(t('validation.tooManyIterations', {max: MAX_ITERATIONS}));
        return;
      }

      let buyToken = bBNB / price;

      preve_price = price;
      prev_totalSupply = totalSupply;
      totalSupply -= buyToken;

      if (totalSupply < 0) {
        bBNB = prev_totalSupply * price;
        lastPayBNB = (prev_totalSupply * price) / lRate / 0.99;
      }

      let realBNB = totalSupply < 0 ? lastPayBNB : maxBNB;

      localTableData.serverFee += realBNB * fee;
      localTableData.userPayBNB += realBNB;

      let _LP = num === 0 ? Math.sqrt(buyToken * bBNB) : (Math.min(buyToken / x, bBNB / y) * localTableData.lpTotals);
      localTableData.lpTotals += _LP;

      x += buyToken;
      y += bBNB;
      localTableData.lToken += buyToken;

      let K = x * y;
      let sToken = K / (y + bBNB * swapRate);

      localTableData.swapBuyToken += x - sToken;

      num++;
      x = sToken;
      y += bBNB * swapRate;
      localTableData.autoMarketBNB += (totalSupply < 0 ? lastPayBNB - fee - bBNB - (bBNB * swapRate) : maxBNB - fee - bBNB - (bBNB * swapRate));

      let newPrice = y / sToken;

      localResults.nums.push(num);
      localResults.dayRates.push('未知');
      localResults.lps.push(_LP);
      localResults.rTokens.push(totalSupply < 0 ? 0 : totalSupply);
      localResults.Ks.push(K);
      localResults.Xs.push(x);
      localResults.Ys.push(y);
      localResults.rates.push(calculateGrowthRate(price, newPrice));
      localResults.payBNBs.push(realBNB);
      localResults.lPayBNBs.push(realBNB);

      price = newPrice;
      localResults.prices.push(parseFloat(newPrice.toFixed(18)));

      // 计算质押产出
      if (num && ((num - autoByNum) % dayCast) === 0) {
        let dayRate = (price - prev_day_price) / prev_day_price;
        let outRate = dayRate > 0.01 ? (dayRate >= 1 ? 0.1 : dayRate * 0.1) : 0.001;
        let outToken = x * outRate;

        let markPint1 = {
          name: `第${num / dayCast}天产出`,
          value: outToken,
          xAxis: num - 1,
          yAxis: preve_price,
        };
        let markPint2 = {
          name: `第${num / dayCast}天涨幅`,
          value: (dayRate * 100).toFixed(2) + '%',
          xAxis: num - 1,
          yAxis: price,
          symbolRotate: 180,
          label: {offset: [0, 12]},
        };

        prev_day_price = price;

        localTableData.tokenOutputTotals += outToken;
        localResults.tokenOutputs.push(markPint1, markPint2);

        let piecesItem = {gt: num - 1, lt: num, color: 'rgba(0, 0, 180, 0.4)'};

        let autoBNB = localTableData.autoMarketBNB * autoByRate;
        K = x * y;
        sToken = K / (y + autoBNB);

        localTableData.swapBuyToken += x - sToken;

        num++;
        autoByNum++;
        x = sToken;
        y += autoBNB;
        localTableData.autoMarketBNB -= autoBNB;

        newPrice = y / sToken;

        localResults.dayRates[localResults.dayRates.length - 1] = ((dayRate * 100).toFixed(2) + '%');

        localResults.nums.push('auto');
        localResults.dayRates.push('未知');
        localResults.lps.push(_LP);
        localResults.rTokens.push(totalSupply < 0 ? 0 : totalSupply);
        localResults.Ks.push(K);
        localResults.Xs.push(x);
        localResults.Ys.push(y);
        localResults.rates.push(calculateGrowthRate(price, newPrice));
        localResults.pieces.push(piecesItem);
        localResults.payBNBs.push(autoBNB);
        localResults.lPayBNBs.push(totalSupply < 0 ? lastPayBNB : maxBNB);

        price = newPrice;
        localResults.prices.push(parseFloat(newPrice.toFixed(18)));
      }
    }

    // 计算回报率
    localResults.lps.forEach((item, idx) => {
      let _rate = (item as number) / localTableData.lpTotals;
      let _token = _rate * (localResults.Xs[num - 1] as number);
      let _BNB = _rate * (localResults.Ys[num - 1] as number);
      let payBNB = localResults.lPayBNBs[idx] as number;
      let res = (((_token * price + _BNB) - payBNB) / payBNB * 100);

      localResults.reports.push(res);
      localResults.ransomBNBs.push(_BNB);
      localResults.ransomTokens.push(_token);
      localResults.ransomTokensToBNB.push(_token * price);
    });

    // 一次性更新 state
    setTableData(localTableData);
    setResults(localResults);

    // 初始化图表
    if (chartRef.current) {
      const chart = echarts.init(chartRef.current);
      chartInstanceRef.current = chart;
      chartArgsRef.current = {localResults, currentPrice: price, initPrice: tableData.price};
      echartsInit(chart, localResults, price, tableData.price);
    }
  };

  // 查询LP
  const searchLP = (idx: string) => {
    if (isNaN(Number(idx))) return;

    if (Number(idx) > results.nums.length) {
      setError(t('error.queryExceed'));
      return;
    }

    const index = Number(idx) - 1;
    setLpData({
      num: Number(idx),
      payBNB: (results.payBNBs[index] as number) || 0,
      reports: (results.reports[index] as number) || 0,
      ransomBNBs: (results.ransomBNBs[index] as number) || 0,
      ransomTokens: (results.ransomTokens[index] as number) || 0,
    });
  };

  // 初始化ECharts
  const echartsInit = (chart: echarts.ECharts, localResults: Results, currentPrice: number, initPrice: string) => {
    const textColor = getCssVar('--text');
    const borderColor = getCssVar('--border');
    const textMutedColor = getCssVar('--text-muted');
    const bgColor = getCssVar('--background-02');

    const option: echarts.EChartsOption = {
      title: {
        text: t('chart.title'),
        left: 'center',
        top: 16,
        textStyle: {
          color: textColor,
          fontSize: 18,
          fontWeight: 600,
        },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          animation: false,
          type: 'cross',
          lineStyle: {
            color: 'rgba(255, 255, 255, 0.1)',
            width: 1,
          },
        },
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        padding: [12, 16],
        textStyle: {
          color: '#fff',
          fontSize: 12,
          lineHeight: 1.8,
        },
        formatter: function (params: any) {
          const p = Array.isArray(params) ? params : [params];
          const mainIndex = p[1]?.dataIndex || 0;

          const lines = [
            `<div style="padding: 2px 0; line-height: 1.4;">${t('chart.tooltip.nums')}: ${localResults.nums[mainIndex]}</div>`,
            ...p.map((item: any) => `<div style="padding: 2px 0; line-height: 1.4;">${item.seriesName}: ${Number(item.value).toFixed(8)}</div>`),
            `<div style="padding: 2px 0; line-height: 1.4;">${t('chart.tooltip.Ks')}: ${localResults.Ks[mainIndex]}</div>`,
            `<div style="padding: 2px 0; line-height: 1.4;">${t('chart.tooltip.Xs')}: ${localResults.Xs[mainIndex]}</div>`,
            `<div style="padding: 2px 0; line-height: 1.4;">${t('chart.tooltip.Ys')}: ${localResults.Ys[mainIndex]}</div>`,
            `<div style="padding: 2px 0; line-height: 1.4;">${t('chart.tooltip.rates')}: ${localResults.rates[mainIndex]}</div>`,
            `<div style="padding: 2px 0; line-height: 1.4;">${t('chart.tooltip.payBNBs')}: ${localResults.payBNBs[mainIndex]}</div>`,
            `<div style="padding: 2px 0; line-height: 1.4;">${t('chart.tooltip.ransomBNBs')}: ${localResults.ransomBNBs[mainIndex]}</div>`,
            `<div style="padding: 2px 0; line-height: 1.4;">${t('chart.tooltip.ransomTokens')}: ${localResults.ransomTokens[mainIndex]}</div>`,
            `<div style="padding: 2px 0; line-height: 1.4;">${t('chart.tooltip.ransomTokensToBNB')}: ${localResults.ransomTokensToBNB[mainIndex]}</div>`,
            `<div style="padding: 2px 0; line-height: 1.4;">${t('chart.tooltip.dayRates')}: ${localResults.dayRates[mainIndex]}</div>`,
          ];

          return lines.join('');
        },
      },
      legend: {
        data: [t('chart.legend.price'), t('chart.legend.remaining'), t('chart.legend.roi')],
        left: 16,
        top: 50,
        textStyle: {
          color: textColor,
          fontSize: 13,
        },
        itemGap: 24,
        borderRadius: 4,
        backgroundColor: bgColor,
        padding: [8, 16],
        borderWidth: 1,
        borderColor: borderColor,
      },
      axisPointer: {
        link: [{xAxisIndex: 'all'}],
      },
      dataZoom: [
        {show: true, realtime: true, start: 0, end: 100, xAxisIndex: [0, 1], bottom: 8},
        {type: 'inside', realtime: true, start: 0, end: 100, xAxisIndex: [0, 1]},
        {type: 'inside', realtime: true, start: 0, end: 100, xAxisIndex: [0, 1]},
      ],
      grid: [
        {left: 80, right: 50, height: '22%', top: 100},
        {left: 80, right: 50, top: '38%', height: '22%'},
        {left: 80, right: 50, top: '68%', height: '22%'},
      ],
      xAxis: [
        {
          type: 'category',
          boundaryGap: false,
          axisLine: {onZero: false, lineStyle: {color: borderColor}},
          axisLabel: {color: textMutedColor, fontSize: 11},
          splitLine: {show: true, lineStyle: {color: borderColor}},
          data: localResults.nums,
        },
        {
          gridIndex: 1,
          type: 'category',
          boundaryGap: false,
          axisLine: {onZero: false, lineStyle: {color: borderColor}},
          axisLabel: {color: textMutedColor, fontSize: 11},
          splitLine: {show: true, lineStyle: {color: borderColor}},
          data: localResults.nums,
        },
        {
          gridIndex: 2,
          type: 'category',
          boundaryGap: false,
          axisLine: {onZero: false, lineStyle: {color: borderColor}},
          axisLabel: {color: textMutedColor, fontSize: 11},
          splitLine: {show: true, lineStyle: {color: borderColor}},
          data: localResults.nums,
        },
      ],
      yAxis: [
        {
          type: 'value',
          axisLine: {onZero: false, lineStyle: {color: borderColor}},
          axisLabel: {color: textMutedColor, fontSize: 11},
          splitLine: {show: true, lineStyle: {color: borderColor}},
        },
        {
          gridIndex: 1,
          type: 'value',
          axisLine: {onZero: false, lineStyle: {color: borderColor}},
          axisLabel: {color: textMutedColor, fontSize: 11},
          splitLine: {show: true, lineStyle: {color: borderColor}},
        },
        {
          gridIndex: 2,
          type: 'value',
          axisLine: {onZero: false, lineStyle: {color: borderColor}},
          axisLabel: {color: textMutedColor, fontSize: 11},
          splitLine: {show: true, lineStyle: {color: borderColor}},
        },
      ],
      visualMap: {
        type: 'piecewise',
        show: false,
        dimension: 0,
        seriesIndex: 0,
        pieces: localResults.pieces,
      },
      series: [
        {
          name: t('chart.legend.price'),
          type: 'line',
          symbolSize: 6,
          data: localResults.prices,
          markPoint: {
            data: localResults.tokenOutputs,
            itemStyle: {color: '#ffa726', borderColor: '#fff', borderWidth: 2},
            label: {color: '#ffa726', fontSize: 11, fontWeight: 600},
          },
          symbol: 'circle',
          smooth: 0.3,
          lineStyle: {color: '#5470C6', width: 2},
          areaStyle: {color: 'rgba(84, 112, 198, 0.15)'},
          itemStyle: {color: '#5470C6', borderColor: '#fff', borderWidth: 1},
        },
        {
          name: t('chart.legend.remaining'),
          type: 'line',
          xAxisIndex: 1,
          yAxisIndex: 1,
          symbolSize: 5,
          data: localResults.rTokens,
          smooth: 0.3,
          lineStyle: {color: '#26c6da', width: 2},
          areaStyle: {color: 'rgba(38, 198, 218, 0.15)'},
          itemStyle: {color: '#26c6da', borderColor: '#fff', borderWidth: 1},
        },
        {
          name: t('chart.legend.roi'),
          type: 'line',
          xAxisIndex: 2,
          yAxisIndex: 2,
          symbolSize: 5,
          data: localResults.reports,
          smooth: 0.3,
          lineStyle: {color: '#ffa726', width: 2},
          areaStyle: {color: 'rgba(255, 167, 38, 0.15)'},
          itemStyle: {color: '#ffa726', borderColor: '#fff', borderWidth: 1},
        },
      ],
    };

    chart.setOption(option);
  };

  // 窗口 resize 监听
  useEffect(() => {
    const chart = chartInstanceRef.current;
    if (!chart) return;

    const handleResize = () => {
      chart.resize();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // 主题切换时重新初始化图表
  useEffect(() => {
    const chart = chartInstanceRef.current;
    const args = chartArgsRef.current;
    if (!chart || !args) return;

    echartsInit(chart, args.localResults, args.currentPrice, args.initPrice);
  }, [resolvedTheme]);

  // 组件卸载时清理图表
  useEffect(() => {
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.dispose();
      }
    };
  }, []);

  return (
    <div className="fomo-tool-container mt-10">
      {/* 表单区 */}
      <div className="form-section">
        <div className="form-row">
          <label>{t('form.totalSupply')}</label>
          <input
            type="number"
            className="input"
            value={tableData.totalSupply}
            onChange={(e) => setTableData({...tableData, totalSupply: Number(e.target.value)})}
            placeholder={t('form.totalSupply')}
          />
          <label>{t('form.price')}</label>
          <input
            type="text"
            className="input"
            value={tableData.price}
            onChange={(e) => setTableData({...tableData, price: e.target.value})}
            placeholder={t('form.price')}
          />
          <label>{t('form.maxBNB')}</label>
          <input
            type="number"
            className="input"
            value={tableData.maxBNB}
            onChange={(e) => setTableData({...tableData, maxBNB: Number(e.target.value)})}
            placeholder={t('form.maxBNB')}
            min="0.1"
          />
          <label>{t('form.swapRate')}</label>
          <input
            type="number"
            className="input"
            value={tableData.swapRate}
            onChange={(e) => setTableData({...tableData, swapRate: Number(e.target.value)})}
            placeholder={t('form.swapRate')}
            min="0.1"
            max="1"
            step="0.1"
          />
          <label>{t('form.lRate')}</label>
          <input
            type="number"
            className="input"
            value={tableData.lRate}
            onChange={(e) => setTableData({...tableData, lRate: Number(e.target.value)})}
            placeholder={t('form.lRate')}
            min="0.1"
            max="0.5"
            step="0.1"
          />
          <label>{t('form.dayCast')}</label>
          <input
            type="number"
            className="input"
            value={tableData.dayCast}
            onChange={(e) => setTableData({...tableData, dayCast: Number(e.target.value)})}
            placeholder={t('form.dayCast')}
            min="1"
            step="1"
          />
          <button className="button primary" onClick={handleCreate}>
            {t('form.submit')}
          </button>
        </div>
      </div>

      {/* 错误提示 */}
      {error && <div className="error-message">{error}</div>}

      {/* 第一行统计信息 */}
      <div className="stats-section first-row">
        <div className="stat-item">
          <span className="label">{t('stats.lToken')}:</span>
          <span className="value">{tableData.lToken.toFixed(2)}</span>
        </div>
        <div className="stat-item">
          <span className="label">{t('stats.numsLength')}:</span>
          <span className="value">{results.nums.length}</span>
        </div>
        <div className="stat-item">
          <span className="label">{t('stats.userPayBNB')}:</span>
          <span className="value">{tableData.userPayBNB.toFixed(2)}</span>
        </div>
        <div className="stat-item">
          <span className="label">{t('stats.serverFee')}:</span>
          <span className="value">{tableData.serverFee.toFixed(2)}</span>
        </div>
        <div className="stat-item">
          <span className="label">{t('stats.autoMarketBNB')}:</span>
          <span className="value">{tableData.autoMarketBNB.toFixed(2)}</span>
        </div>
        <div className="stat-item">
          <span className="label">{t('stats.swapBuyToken')}:</span>
          <span className="value">{tableData.swapBuyToken.toFixed(2)}</span>
        </div>
      </div>

      {/* 第二行统计信息 */}
      <div className="stats-section second-row">
        <div className="stat-item">
          <span className="label">{t('stats.poolBNB')}:</span>
          <span className="value">{(results.Ys[results.nums.length - 1] || 0)}</span>
        </div>
        <div className="stat-item">
          <span className="label">{t('stats.poolToken')}:</span>
          <span className="value">{(results.Xs[results.nums.length - 1] || 0)}</span>
        </div>
        <div className="stat-item">
          <span className="label">{t('stats.currentPrice')}:</span>
          <span className="value">{(results.prices[results.nums.length - 1] || 0)}</span>
        </div>
        <div className="stat-item">
          <span className="label">{t('stats.maxGrowth')}:</span>
          <span className="value">
            {results.prices.length ? calculateGrowthRate(parseFloat(tableData.price), results.prices[results.nums.length - 1]) : '0%'}
          </span>
        </div>
        <div className="stat-item">
          <span className="label">{t('stats.lpTotal')}:</span>
          <span className="value">{tableData.lpTotals.toFixed(2)}</span>
        </div>
        <div className="stat-item">
          <span className="label">{t('stats.tokenOutput')}:</span>
          <span className="value">{tableData.tokenOutputTotals.toFixed(2)}</span>
        </div>
      </div>

      {/* LP查询区 */}
      <div className="lp-query-section">
        <label>{t('lpQuery.label')}</label>
        <input
          type="number"
          className="input"
          value={reportsIdx}
          onChange={(e) => setReportsIdx(e.target.value.replace(/[^0-9]/g, ''))}
          placeholder={t('lpQuery.placeholder')}
        />
        <button
          className="button primary"
          onClick={() => searchLP(reportsIdx)}
          disabled={!results.nums.length}
        >
          {t('lpQuery.button')}
        </button>
      </div>

      {/* LP查询结果 */}
      <div className="stats-section query-result">
        <div className="stat-item">
          <span className="label">{t('lpQuery.index')}:</span>
          <span className="value">{lpData.num}</span>
        </div>
        <div className="stat-item">
          <span className="label">{t('lpQuery.roi')}:</span>
          <span className="value">{lpData.reports.toFixed(4)}%</span>
        </div>
        <div className="stat-item">
          <span className="label">{t('lpQuery.payBNB')}:</span>
          <span className="value">{lpData.payBNB.toFixed(2)}</span>
        </div>
        <div className="stat-item">
          <span className="label">{t('lpQuery.ransomBNB')}:</span>
          <span className="value">{lpData.ransomBNBs.toFixed(2)}</span>
        </div>
        <div className="stat-item">
          <span className="label">{t('lpQuery.ransomToken')}:</span>
          <span className="value">{lpData.ransomTokens.toFixed(2)}</span>
        </div>
      </div>

      {/* 图表容器 */}
      <div ref={chartRef} style={{width: '100%', height: '930px', marginTop: '30px'}} />
    </div>
  );
}
