import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, CornerDownLeft, Shield, Users, RefreshCw } from 'lucide-react';

interface MessageItem {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  time: string;
  buttons?: { text: string; callback_data?: string; url?: string }[][];
  cardUrl?: string;
}

interface BotSimulatorProps {
  onSimulateMessage: (text: string, fromId?: number, isGroup?: boolean) => Promise<any>;
}

export const BotSimulator: React.FC<BotSimulatorProps> = ({ onSimulateMessage }) => {
  const [inputText, setInputText] = useState<string>('');
  const [isAdminMode, setIsAdminMode] = useState<boolean>(true);
  const [isGroupMode, setIsGroupMode] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: '1',
      sender: 'bot',
      text:
        '👋 سلام! به ربات قیمت لحظه‌ای ارز دیجیتال و طلا خوش آمدید.\n' +
        '💡 می‌توانید نام یا نماد ارز مورد نظر خود را ارسال کنید تا قیمت و اطلاعات آن را دریافت کنید.\n\n' +
        'مثال‌ها:\n' +
        '• بیت کوین\n' +
        '• 0.5 اتریوم\n' +
        '• 2 USDT\n' +
        '• 1.5 گرم طلا',
      time: '12:00',
      buttons: [
        [
          {
            text: '➕ اضافه کردن به گروه',
            url: 'https://t.me/Modasr_Arzbot?startgroup=start',
          },
        ],
      ],
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || loading) return;

    const userTime = new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    const userMsg: MessageItem = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      time: userTime,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setLoading(true);

    try {
      const fromId = isAdminMode ? 0 : 99988877;
      const res = await onSimulateMessage(query, fromId, isGroupMode);
      const botResponseText = res?.result?.responseText || '';

      if (botResponseText) {
        // Determine if inline buttons should appear
        let buttons: any = undefined;
        if (query === '/admin' && isAdminMode) {
          buttons = [
            [{ text: '📊 آمار', callback_data: 'stats' }],
            [
              { text: '🔄 فوروارد', callback_data: 'forward' },
              { text: '📢 همگانی', callback_data: 'broadcast' },
            ],
            [
              { text: '✅ آنبلاک', callback_data: 'unblock' },
              { text: '🚫 بلاک', callback_data: 'block' },
            ],
            [
              { text: '🔴 خاموش', callback_data: 'disable' },
              { text: '🟢 روشن', callback_data: 'enable' },
            ],
            [{ text: '📁 لیست گروه‌ها', callback_data: 'list_groups' }],
          ];
        } else {
          buttons = [
            [
              {
                text: '➕ اضافه کردن به گروه',
                url: 'https://t.me/Modasr_Arzbot?startgroup=start',
              },
            ],
          ];
        }

        const botTime = new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
        const botMsg: MessageItem = {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: botResponseText,
          time: botTime,
          buttons,
          cardUrl: res?.cardUrl,
        };

        setMessages((prev) => [...prev, botMsg]);
      } else {
        // Show subtle info that bot quietly ignored unrelated chat
        const botTime = new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: 'bot',
            text: '🔇 [ربات پاسخی ارسال نکرد - متن ارسالی شامل نام ارز یا طلا نبود]',
            time: botTime,
          },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: '⚠️ خطا در پردازش پیام در سرور.',
          time: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleButtonClick = (button: { text: string; callback_data?: string; url?: string }) => {
    if (button.url) {
      window.open(button.url, '_blank');
      return;
    }
    if (button.callback_data) {
      // Simulate callback by sending a command or action name
      if (button.callback_data === 'stats') {
        handleSend('درخواست آمار ربات');
      } else if (button.callback_data === 'list_groups') {
        handleSend('نمایش لیست گروه‌ها');
      } else if (button.callback_data === 'enable') {
        handleSend('روشن کردن ربات');
      } else if (button.callback_data === 'disable') {
        handleSend('خاموش کردن ربات');
      } else {
        handleSend(button.text);
      }
    }
  };

  const quickSamples = [
    'بیت کوین',
    'طلا ۱۸ عیار',
    'سکه امامی',
    'تتر',
    'تون کوین',
    'اتریوم',
    'سولانا',
    'نفت',
    'دلار',
    'یورو',
    '/start',
    '/admin',
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      
      {/* Simulator Chat Area (3 Cols) */}
      <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col h-[650px] shadow-2xl overflow-hidden">
        
        {/* Chat Header */}
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-cyan-600 flex items-center justify-center text-white shadow-md shadow-cyan-600/30">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">Modasr Arzbot</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono">
                  bot
                </span>
              </div>
              <span className="text-xs text-slate-400 font-mono">@Modasr_Arzbot</span>
            </div>
          </div>

          {/* Mode Toggles */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAdminMode(!isAdminMode)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all ${
                isAdminMode
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="تغییر نقش به مالک ربات برای تست دستور /admin"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>{isAdminMode ? 'حالت: ادمین' : 'حالت: کاربر عادی'}</span>
            </button>

            <button
              onClick={() => setIsGroupMode(!isGroupMode)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all ${
                isGroupMode
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="تغییر محیط به گروه تلگرامی"
            >
              <Users className="w-3.5 h-3.5" />
              <span>{isGroupMode ? 'پیام گروه' : 'پیام شخصی'}</span>
            </button>
          </div>
        </div>

        {/* Message Feed */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-950/40">
          {messages.map((m) => {
            const isBot = m.sender === 'bot';
            return (
              <div key={m.id} className={`flex ${isBot ? 'justify-start' : 'justify-end'} gap-2`}>
                {isBot && (
                  <div className="w-7 h-7 rounded-full bg-cyan-700/80 flex items-center justify-center text-white text-xs mt-1 shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                
                <div className="max-w-[85%] sm:max-w-[70%] space-y-2">
                  {/* Photo Card Preview (Chart + Small Logo + Flag + Brand Theme) */}
                  {m.cardUrl && (
                    <div className="rounded-2xl overflow-hidden border border-slate-700/60 shadow-xl bg-slate-900 group relative">
                      <img
                        src={m.cardUrl}
                        alt="Visual Price Chart"
                        className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-[1.01]"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                        <span>7D Chart &amp; Live Rates</span>
                      </div>
                    </div>
                  )}

                  <div
                    className={`p-3.5 text-xs whitespace-pre-wrap leading-relaxed shadow-md ${
                      isBot
                        ? 'bg-slate-800/90 text-slate-100 rounded-2xl rounded-tr-sm border border-slate-700/50'
                        : 'bg-cyan-600 text-white rounded-2xl rounded-tl-sm'
                    }`}
                  >
                    {m.text}
                    <div
                      className={`text-[10px] mt-1.5 text-left font-mono ${
                        isBot ? 'text-slate-400' : 'text-cyan-200'
                      }`}
                    >
                      {m.time}
                    </div>
                  </div>

                  {/* Render Inline Buttons if any */}
                  {m.buttons && m.buttons.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      {m.buttons.map((row, rIdx) => (
                        <div key={rIdx} className="flex gap-1.5">
                          {row.map((btn, bIdx) => (
                            <button
                              key={bIdx}
                              onClick={() => handleButtonClick(btn)}
                              className="flex-1 py-1.5 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-cyan-300 hover:text-white border border-cyan-500/20 text-xs font-medium transition-all text-center"
                            >
                              {btn.text}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {!isBot && (
                  <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-white text-xs mt-1 shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-slate-400 p-2">
              <div className="w-6 h-6 rounded-full bg-cyan-800/50 flex items-center justify-center animate-spin">
                <RefreshCw className="w-3.5 h-3.5 text-cyan-300" />
              </div>
              <span>در حال استعلام نرخ لحظه‌ای از API و محاسبه...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-slate-900 border-t border-slate-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="ارسال پیام به ربات (مثال: بیت کوین، 0.5 اتریوم، 2 طلا، /start، /admin)..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || loading}
              className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-md shadow-cyan-600/20 disabled:opacity-50 active:scale-95 transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Quick Test Samples & Helpers (1 Col) */}
      <div className="space-y-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-xs text-white">تست سریع دستورات</h3>
          </div>
          <p className="text-[11px] text-slate-400">
            برای تست فوری عملکرد محاسبات، روی هر یک کلیک کنید:
          </p>

          <div className="flex flex-wrap gap-1.5">
            {quickSamples.map((sample) => (
              <button
                key={sample}
                onClick={() => handleSend(sample)}
                disabled={loading}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-cyan-500/40 text-slate-200 text-xs font-medium transition-all active:scale-95"
              >
                {sample}
              </button>
            ))}
          </div>
        </div>

        {/* Syntax Help */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-2 text-xs">
          <h4 className="font-bold text-slate-200">الگوهای قابل تشخیص:</h4>
          <ul className="space-y-1.5 text-[11px] text-slate-400 list-disc list-inside leading-relaxed">
            <li><strong className="text-slate-200">فقط نام ارز:</strong> مانند <code className="text-cyan-400">بیت کوین</code> یا <code className="text-cyan-400">تتر</code> (معادل ۱ واحد)</li>
            <li><strong className="text-slate-200">تعداد + نام:</strong> مانند <code className="text-cyan-400">0.5 اتریوم</code> یا <code className="text-cyan-400">2.5 طلا</code></li>
            <li><strong className="text-slate-200">دستور ادمین:</strong> <code className="text-cyan-400">/admin</code> (فقط با آیدی ادمین)</li>
            <li><strong className="text-slate-200">اعداد فارسی:</strong> ربات ارقام فارسی مانند <code className="text-cyan-400">۱.۵ طلا</code> را نیز پشتیبانی می‌کند.</li>
          </ul>
        </div>
      </div>

    </div>
  );
};
