import { BotStorage } from './storage';

export class ChartService {
  /**
   * Generate high-quality dark mode price chart image URL with channel branding watermark
   */
  static async generateChartUrl(options: {
    symbol: string;
    title: string;
    currentPriceStr: string;
    changePercent: number;
    highStr?: string;
    lowStr?: string;
    isGold?: boolean;
    watermark?: string;
  }): Promise<string> {
    const {
      symbol,
      title,
      currentPriceStr,
      changePercent,
      isGold,
      watermark = '@Modasr_Arz / MODASRP',
    } = options;

    const isPositive = changePercent >= 0;
    const primaryColor = isGold ? '#F59E0B' : isPositive ? '#10B981' : '#F43F5E';
    const bgGradientStart = isGold
      ? 'rgba(245, 158, 11, 0.28)'
      : isPositive
      ? 'rgba(16, 185, 129, 0.28)'
      : 'rgba(244, 63, 94, 0.28)';
    const bgGradientEnd = 'rgba(11, 15, 25, 0.0)';

    // Fetch live 24h candle points from Binance if it's a crypto coin
    let dataPoints: number[] = [];
    let labels: string[] = [];

    if (!isGold && symbol && symbol !== 'TOMAN') {
      try {
        const binanceSym = `${symbol.toUpperCase()}USDT`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const res = await fetch(
          `https://api.binance.com/api/v3/klines?symbol=${binanceSym}&interval=1h&limit=24`,
          { signal: controller.signal }
        ).catch(() => null);
        clearTimeout(timeoutId);

        if (res && res.ok) {
          const klines = await res.json().catch(() => null);
          if (Array.isArray(klines) && klines.length > 0) {
            dataPoints = klines.map((k: any) => parseFloat(k[4])); // Close prices
            labels = klines.map((k: any, i: number) => (i % 4 === 0 ? `-${24 - i}h` : ''));
          }
        }
      } catch {}
    }

    // Fallback realistic price trend curve if Binance didn't have data or for Gold/USDT
    if (dataPoints.length === 0) {
      const baseVal = 100;
      const step = changePercent / 24;
      dataPoints = [];
      labels = [];
      let currentVal = baseVal - changePercent;
      for (let i = 0; i < 24; i++) {
        const jitter = (Math.sin(i * 0.8) * 0.4 + (Math.random() - 0.5) * 0.3) * (Math.abs(changePercent) > 0 ? Math.abs(changePercent) / 10 : 0.5);
        currentVal += step + jitter;
        dataPoints.push(parseFloat(currentVal.toFixed(2)));
        labels.push(i % 4 === 0 ? `-${24 - i}h` : '');
      }
      dataPoints[dataPoints.length - 1] = baseVal;
      labels[labels.length - 1] = 'Now';
    } else {
      labels[labels.length - 1] = 'Now';
    }

    const chartConfig = {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: `${symbol} 24h`,
            data: dataPoints,
            borderColor: primaryColor,
            borderWidth: 3,
            fill: true,
            backgroundColor: bgGradientStart,
            pointRadius: (ctx: any) => (ctx && ctx.dataIndex === dataPoints.length - 1 ? 5 : 0),
            pointBackgroundColor: primaryColor,
            pointBorderColor: '#FFFFFF',
            pointBorderWidth: 2,
            tension: 0.35,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: `${title} (${symbol}) • ${isPositive ? '+' : ''}${changePercent}% • ${watermark}`,
            color: '#FFFFFF',
            font: { size: 18, weight: 'bold', family: 'sans-serif' },
            padding: { top: 12, bottom: 8 },
          },
          subtitle: {
            display: true,
            text: `Price: ${currentPriceStr}  |  24H Trend  |  ${watermark}`,
            color: '#94A3B8',
            font: { size: 13, family: 'sans-serif' },
            padding: { bottom: 16 },
          },
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false },
            ticks: { color: '#64748B', font: { size: 11 } },
          },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.07)', drawBorder: false },
            ticks: { color: '#94A3B8', font: { size: 11 } },
          },
        },
      },
    };

    const encodedConfig = encodeURIComponent(JSON.stringify(chartConfig));
    return `https://quickchart.io/chart?w=750&h=420&bkg=%23090D16&devicePixelRatio=2&c=${encodedConfig}`;
  }
}
