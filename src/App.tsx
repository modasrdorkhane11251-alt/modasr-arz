import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { WebhookPanel } from './components/WebhookPanel';
import { BotSimulator } from './components/BotSimulator';
import { PriceBoard } from './components/PriceBoard';
import { StatsBroadcastPanel } from './components/StatsBroadcastPanel';
import { ActivityLogsPanel } from './components/ActivityLogsPanel';
import { MiniAppView } from './components/MiniAppView';
import { MiniAppPreviewPanel } from './components/MiniAppPreviewPanel';
import { ApiHubPanel } from './components/ApiHubPanel';
import { DEFAULT_BOT_TOKEN } from './bot/config';
import { useTheme } from './context/ThemeContext';

export default function App() {
  const { theme, isWhite } = useTheme();
  const isDirectMiniApp = typeof window !== 'undefined' && (
    window.location.pathname.includes('mini-modasr-arz') ||
    window.location.pathname.startsWith('/miniapp') ||
    window.location.pathname.startsWith('/app') ||
    window.location.search.includes('view=miniapp') ||
    window.location.search.includes('app=mini-modasr-arz') ||
    window.location.search.includes('secret=mini-modasr-arz') ||
    window.location.search.includes('tgWebApp') ||
    Boolean((window as any).Telegram?.WebApp?.initData)
  );

  const [activeTab, setActiveTab] = useState<string>(isDirectMiniApp ? 'miniapp-fullscreen' : 'webhook');
  const [statusData, setStatusData] = useState<any>(null);
  const [statsData, setStatsData] = useState<any>(null);
  const [pricesData, setPricesData] = useState<any>(null);
  const [activeToken, setActiveToken] = useState<string>(DEFAULT_BOT_TOKEN);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/telegram/status?token=${encodeURIComponent(activeToken)}`);
      if (res.ok) {
        const data = await res.json();
        setStatusData(data);
      }
    } catch {
      // Graceful offline/reloading fallback
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/bot/stats');
      if (res.ok) {
        const data = await res.json();
        setStatsData(data);
      }
    } catch {
      // Graceful offline/reloading fallback
    }
  };

  const fetchPrices = async () => {
    try {
      const res = await fetch('/api/bot/prices');
      if (res.ok) {
        const data = await res.json();
        setPricesData(data);
      }
    } catch {
      // Graceful offline/reloading fallback
    }
  };

  const refreshAll = () => {
    fetchStatus();
    fetchStats();
    fetchPrices();
  };

  useEffect(() => {
    refreshAll();
    // Live real-time price synchronization every 2 seconds
    const priceInterval = setInterval(() => {
      fetchPrices();
    }, 2000);
    const statsInterval = setInterval(() => {
      fetchStats();
    }, 5000);
    return () => {
      clearInterval(priceInterval);
      clearInterval(statsInterval);
    };
  }, [activeToken]);

  const handleSetWebhook = async (url: string, dropPending: boolean, token?: string) => {
    const res = await fetch('/api/telegram/set-webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, dropPendingUpdates: dropPending, token: token || activeToken }),
    });
    const data = await res.json();
    fetchStatus();
    return data;
  };

  const handleDeleteWebhook = async (dropPending: boolean, token?: string) => {
    const res = await fetch('/api/telegram/delete-webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dropPendingUpdates: dropPending, token: token || activeToken }),
    });
    const data = await res.json();
    fetchStatus();
    return data;
  };

  const handleStartPolling = async (token?: string, force: boolean = false) => {
    const res = await fetch('/api/telegram/start-polling', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: token || activeToken, force }),
    });
    const data = await res.json();
    fetchStatus();
    return data;
  };

  const handleStopPolling = async () => {
    const res = await fetch('/api/telegram/stop-polling', {
      method: 'POST',
    });
    const data = await res.json();
    fetchStatus();
    return data;
  };

  const handleSimulateMessage = async (text: string, fromId?: number, isGroup?: boolean) => {
    const res = await fetch('/api/bot/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, fromId, isGroup }),
    });
    const data = await res.json();
    fetchStats();
    return data;
  };

  const handleToggleBotStatus = async (enabled: boolean) => {
    const res = await fetch('/api/bot/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    });
    const data = await res.json();
    fetchStats();
    return data;
  };

  const handleBroadcastMessage = async (message: string) => {
    const res = await fetch('/api/bot/broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, token: activeToken }),
    });
    return await res.json();
  };

  // Direct Standalone Telegram Mini App View (Inside Telegram WebApp or Fullscreen)
  if (activeTab === 'miniapp-fullscreen') {
    return (
      <MiniAppView
        isStandalone={isDirectMiniApp}
        onBackToDashboard={() => setActiveTab('miniapp')}
      />
    );
  }

  return (
    <div className={`min-h-screen ${isWhite ? 'bg-white text-black' : 'bg-slate-950 text-slate-100'} flex flex-col selection:bg-cyan-500 selection:text-white transition-colors duration-200`}>
      {/* Header */}
      <Header
        botInfo={statusData?.botInfo}
        webhookInfo={statusData?.webhookInfo}
        botStatus={statsData?.stats?.isEnabled ?? true}
        onRefresh={refreshAll}
        loading={loading}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Tab 1: Webhook & Polling Management */}
        {activeTab === 'webhook' && (
          <WebhookPanel
            statusData={statusData}
            onRefresh={fetchStatus}
            onSetWebhook={handleSetWebhook}
            onDeleteWebhook={handleDeleteWebhook}
            onStartPolling={handleStartPolling}
            onStopPolling={handleStopPolling}
            activeToken={activeToken}
            setActiveToken={setActiveToken}
          />
        )}

        {/* Tab 2: Bot Live Simulator */}
        {activeTab === 'simulator' && (
          <BotSimulator onSimulateMessage={handleSimulateMessage} />
        )}

        {/* Tab 3: Live Price Board */}
        {activeTab === 'prices' && (
          <PriceBoard
            pricesData={pricesData}
            onRefreshPrices={fetchPrices}
            loading={loading}
            onOpenApiHub={() => setActiveTab('apis')}
          />
        )}

        {/* Tab 4: Telegram Mini App (mini MODASR arz) */}
        {activeTab === 'miniapp' && (
          <MiniAppPreviewPanel
            statusData={statusData}
            onOpenFullscreen={() => setActiveTab('miniapp-fullscreen')}
            onOpenApiHub={() => setActiveTab('apis')}
          />
        )}

        {/* Tab 5: Stats & Broadcast */}
        {activeTab === 'admin' && (
          <StatsBroadcastPanel
            statsData={statsData}
            onRefreshStats={fetchStats}
            onToggleBotStatus={handleToggleBotStatus}
            onBroadcastMessage={handleBroadcastMessage}
            onOpenApiHub={() => setActiveTab('apis')}
          />
        )}

        {/* Tab 6: Activity Logs */}
        {activeTab === 'logs' && (
          <ActivityLogsPanel
            logs={statsData?.logs || []}
            onRefresh={fetchStats}
            loading={loading}
          />
        )}

        {/* Tab 7: Comprehensive API Hub & Connections Manager */}
        {activeTab === 'apis' && (
          <ApiHubPanel
            onRefreshPrices={fetchPrices}
            onNavigateToTab={setActiveTab}
          />
        )}

      </main>

      {/* Footer */}
      <footer className={`border-t ${isWhite ? 'border-neutral-200 bg-white text-neutral-700' : 'border-slate-900 bg-slate-950/60 text-slate-500'} py-6 text-center text-xs transition-colors duration-200`}>
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-medium">سامانه و ربات هوشمند استعلام نرخ طلا، ارز و کریپتو</span>
          <span className={`font-mono ${isWhite ? 'text-neutral-900 font-bold' : 'text-slate-400'}`}>
            {statusData?.botInfo?.result?.username ? `@${statusData.botInfo.result.username}` : 'Modasr Arzbot'}
          </span>
        </div>
      </footer>
    </div>
  );
}
