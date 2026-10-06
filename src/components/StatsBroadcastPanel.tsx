import React, { useState, useEffect } from 'react';
import {
  Users,
  Layers,
  UserX,
  Power,
  Megaphone,
  Send,
  Sparkles,
  Edit3,
  Save,
  Link,
  FileText,
  Smile,
  Trash2,
  PlusCircle,
  RotateCcw,
  Check,
  Tag,
  Key,
  Search,
  Filter,
  Palette,
  ExternalLink,
  Copy,
  ChevronUp,
  ChevronDown,
  UserPlus,
  Layers as LayersIcon,
  CheckCircle2,
  Bell,
  ShieldAlert,
  Bug,
  AlertTriangle,
} from 'lucide-react';
import {
  AdConfig,
  EmojiConfig,
  CustomEmojiItem,
  CustomButtonItem,
  ButtonColorTheme,
  ButtonType,
  DEFAULT_CUSTOM_BUTTONS,
  AdminAlertConfig,
  DEFAULT_ADMIN_ALERT_CONFIG,
} from '../bot/types';

interface StatsBroadcastPanelProps {
  statsData: any;
  onRefreshStats: () => void;
  onToggleBotStatus: (enabled: boolean) => Promise<any>;
  onBroadcastMessage: (message: string) => Promise<any>;
}

export const StatsBroadcastPanel: React.FC<StatsBroadcastPanelProps> = ({
  statsData,
  onRefreshStats,
  onToggleBotStatus,
  onBroadcastMessage,
}) => {
  const [broadcastText, setBroadcastText] = useState('');
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Ad and Sponsor Button state
  const [adConfig, setAdConfig] = useState<AdConfig>({
    buttonText: '🖥 خرید سرور ساعتی ↗️',
    buttonUrl: 'https://t.me/MODASR_ARZ',
    headerIntro: 'MØD†SR.lua ᶻ z ƪARZ',
    isEnabled: true,
    enableCharts: true,
    watermarkTag: '@MODASR_ARZ | MODASRP',
    customButtons: DEFAULT_CUSTOM_BUTTONS,
  });
  const [savingAd, setSavingAd] = useState(false);

  // Dynamic Button Form & Manager state
  const [btnText, setBtnText] = useState('');
  const [btnUrl, setBtnUrl] = useState('');
  const [btnType, setBtnType] = useState<ButtonType>('url');
  const [btnColor, setBtnColor] = useState<ButtonColorTheme>('blue');
  const [btnEmoji, setBtnEmoji] = useState('💻');
  const [btnPremiumId, setBtnPremiumId] = useState('');
  const [btnRow, setBtnRow] = useState(1);
  const [btnInGroup, setBtnInGroup] = useState(true);
  const [btnInPrivate, setBtnInPrivate] = useState(true);
  const [btnInChannel, setBtnInChannel] = useState(true);
  const [isBtnFormOpen, setIsBtnFormOpen] = useState(false);
  const [editingBtnId, setEditingBtnId] = useState<string | null>(null);

  // Premium Emoji state
  const [emojiConfig, setEmojiConfig] = useState<EmojiConfig>({
    coinEmoji: '![✨](tg://emoji?id=5832577678300943429)',
    tomanEmoji: '▫️',
    dollarEmoji: '💵',
    highLowEmoji: '📊',
    upEmoji: '🟢',
    downEmoji: '🔴',
    planeEmoji: '✈️',
    items: [],
  });

  // Modal / Form state for Add/Edit Emoji
  const [editingItem, setEditingItem] = useState<{
    id?: string;
    name: string;
    key: string;
    emojiTag: string;
  }>({
    name: '',
    key: 'usdt',
    emojiTag: '![💵](tg://emoji?id=5321231658156830001)',
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [savingEmojiItem, setSavingEmojiItem] = useState(false);

  // Bulk Import state
  const [bulkEmojiText, setBulkEmojiText] = useState(
    '![🛢](tg://emoji?id=6019179941294251937)![🛢](tg://emoji?id=5231053919219623276)![💵](tg://emoji?id=5321231658156830001)![💰](tg://emoji?id=5807828680877022050)![💰](tg://emoji?id=5805414501234774753)![🪙](tg://emoji?id=5857272597791641611)![🥈](tg://emoji?id=5231469341341393133)![💎](tg://emoji?id=5319302869948596289)![🥇](tg://emoji?id=5229235915397801267)![🗄](tg://emoji?id=5321371721335338151)![🇺🇸](tg://emoji?id=5224321781321442532)![🇪🇺](tg://emoji?id=5222108911091331711)![🇬🇧](tg://emoji?id=5224518800061245598)'
  );
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [importingBulk, setImportingBulk] = useState(false);

  // Search & Category Filter state
  const [emojiSearch, setEmojiSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'gold' | 'crypto' | 'fiat' | 'oil' | 'system'>('all');

  // Auto-Channel Hourly Poster state
  const [channelConfig, setChannelConfig] = useState({
    isEnabled: true,
    channelId: '@MODASR_ARZ',
    intervalMinutes: 60,
    postMode: 'image_card_and_summary',
    lastPostTime: 0,
    nextPostMinutes: 60,
    lastPostStatus: 'ready',
    lastPostError: '',
  });
  const [savingChannelConfig, setSavingChannelConfig] = useState(false);
  const [postingNow, setPostingNow] = useState(false);

  const fetchChannelConfig = () => {
    fetch('/api/channel/config')
      .then((r) => r.json())
      .then((data) => {
        if (data?.ok && data.config) {
          setChannelConfig({
            ...data.config,
            nextPostMinutes: data.nextPostMinutes ?? 60,
          });
        }
      })
      .catch(() => {});
  };

  const handleSaveChannelConfig = async () => {
    try {
      setSavingChannelConfig(true);
      const res = await fetch('/api/channel/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(channelConfig),
      });
      const data = await res.json();
      if (data?.ok) {
        setFeedback({ type: 'success', text: '✅ تنظیمات ارسال خودکار ساعتی به کانال با موفقیت ذخیره شد.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'خطا در ذخیره تنظیمات کانال' });
    } finally {
      setSavingChannelConfig(false);
    }
  };

  const handlePostNow = async () => {
    try {
      setPostingNow(true);
      setFeedback(null);
      const res = await fetch('/api/channel/post-now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId: channelConfig.channelId }),
      });
      const data = await res.json();
      if (data?.success) {
        setFeedback({ type: 'success', text: `✅ گزارش کامل ارزها و تصویر کارت به کانال ${channelConfig.channelId} ارسال شد!` });
        fetchChannelConfig();
      } else {
        setFeedback({ type: 'error', text: `⚠️ ${data?.message || data?.error || 'خطا در ارسال به کانال'}` });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'خطا در برقراری ارتباط با سرور' });
    } finally {
      setPostingNow(false);
    }
  };

  const handleBulkImport = async () => {
    if (!bulkEmojiText.trim()) return;
    try {
      setImportingBulk(true);
      setFeedback(null);
      const res = await fetch('/api/bot/emoji-bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: bulkEmojiText }),
      });
      const data = await res.json();
      if (data?.ok) {
        setFeedback({ type: 'success', text: '✅ تمام ایموجی‌های پرمیوم با موفقیت تفکیک و اعمال شدند.' });
        setIsBulkOpen(false);
        fetchEmojiConfig();
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'خطا در ثبت ایموجی‌ها' });
    } finally {
      setImportingBulk(false);
    }
  };

  const fetchEmojiConfig = () => {
    fetch('/api/bot/emoji-config')
      .then((r) => r.json())
      .then((data) => {
        if (data?.ok && data.emojiConfig) {
          setEmojiConfig(data.emojiConfig);
        }
      })
      .catch(() => {});
  };

  // Admin Private Error & Bug Alert state
  const [alertConfig, setAlertConfig] = useState<AdminAlertConfig>(DEFAULT_ADMIN_ALERT_CONFIG);
  const [savingAlert, setSavingAlert] = useState(false);
  const [testingAlert, setTestingAlert] = useState(false);

  const fetchAlertConfig = () => {
    fetch('/api/bot/alert-config')
      .then((r) => r.json())
      .then((data) => {
        if (data?.ok && data.alertConfig) {
          setAlertConfig(data.alertConfig);
        }
      })
      .catch(() => {});
  };

  const handleSaveAlertConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setSavingAlert(true);
      setFeedback(null);
      const res = await fetch('/api/bot/alert-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alertConfig),
      });
      const data = await res.json();
      if (data?.ok) {
        setFeedback({ type: 'success', text: '✅ تنظیمات ارسال لحظه‌ای خطاها به پیوی ادمین با موفقیت ذخیره شد.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'خطا در ذخیره تنظیمات هشدار' });
    } finally {
      setSavingAlert(false);
    }
  };

  const handleTestAlert = async () => {
    try {
      setTestingAlert(true);
      setFeedback(null);
      const res = await fetch('/api/bot/alert-config/test', { method: 'POST' });
      const data = await res.json();
      if (data?.ok) {
        setFeedback({ type: 'success', text: `✅ ${data.message}` });
      } else {
        setFeedback({ type: 'error', text: `⚠️ ${data.message || 'خطا در ارسال تست'}` });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'خطا در برقراری ارتباط' });
    } finally {
      setTestingAlert(false);
    }
  };

  useEffect(() => {
    fetch('/api/bot/ad-config')
      .then((r) => r.json())
      .then((data) => {
        if (data?.ok && data.adConfig) {
          setAdConfig(data.adConfig);
        }
      })
      .catch(() => {});

    fetchEmojiConfig();
    fetchChannelConfig();
    fetchAlertConfig();
  }, []);

  const stats = statsData?.stats;
  const isEnabled = stats?.isEnabled ?? true;
  const usersCount = stats?.usersCount ?? 0;
  const groupsCount = stats?.groupsCount ?? 0;
  const blockedCount = stats?.blockedCount ?? 0;

  const handleToggleStatus = async () => {
    try {
      setTogglingStatus(true);
      await onToggleBotStatus(!isEnabled);
      onRefreshStats();
    } catch (e: any) {
      setFeedback({ type: 'error', text: e.message || 'خطا در تغییر وضعیت ربات' });
    } finally {
      setTogglingStatus(false);
    }
  };

  const COLOR_THEMES: Array<{
    key: ButtonColorTheme;
    name: string;
    bgClass: string;
    borderClass: string;
    textClass: string;
    gradientClass: string;
    previewBadge: string;
  }> = [
    { key: 'emerald', name: 'سبز نئونی (افزودن به گروه)', bgClass: 'bg-emerald-500/20', borderClass: 'border-emerald-500/40', textClass: 'text-emerald-300', gradientClass: 'from-emerald-600 to-teal-600', previewBadge: '🟢' },
    { key: 'blue', name: 'آبی اقیانوسی (سرور و تبلیغات)', bgClass: 'bg-blue-500/20', borderClass: 'border-blue-500/40', textClass: 'text-blue-300', gradientClass: 'from-blue-600 to-indigo-600', previewBadge: '🔵' },
    { key: 'purple', name: 'بنفش پرمیوم (VIP لوکس)', bgClass: 'bg-purple-500/20', borderClass: 'border-purple-500/40', textClass: 'text-purple-300', gradientClass: 'from-purple-600 to-fuchsia-600', previewBadge: '🟣' },
    { key: 'amber', name: 'طلایی ارزنده (کریپتو)', bgClass: 'bg-amber-500/20', borderClass: 'border-amber-500/40', textClass: 'text-amber-300', gradientClass: 'from-amber-500 to-yellow-600', previewBadge: '🟡' },
    { key: 'cyan', name: 'فیروزه‌ای الماسی (تلگرام)', bgClass: 'bg-cyan-500/20', borderClass: 'border-cyan-500/40', textClass: 'text-cyan-300', gradientClass: 'from-cyan-500 to-blue-500', previewBadge: '💎' },
    { key: 'rose', name: 'قرمز آتشین (ویژه)', bgClass: 'bg-rose-500/20', borderClass: 'border-rose-500/40', textClass: 'text-rose-300', gradientClass: 'from-rose-600 to-red-600', previewBadge: '🔴' },
    { key: 'orange', name: 'نارنجی بیت‌کوین (Bitcoin)', bgClass: 'bg-orange-500/20', borderClass: 'border-orange-500/40', textClass: 'text-orange-300', gradientClass: 'from-orange-500 to-amber-600', previewBadge: '🟠' },
    { key: 'dark', name: 'مشکی مینیمال (Dark)', bgClass: 'bg-slate-800', borderClass: 'border-slate-700', textClass: 'text-slate-200', gradientClass: 'from-slate-800 to-slate-900', previewBadge: '▫️' },
  ];

  const POPULAR_BUTTON_EMOJIS = [
    '👾', '💻', '💎', '🚀', '👑', '⚡', '🪙', '📊',
    '🔥', '🏆', '🎁', '🛍️', '⭐️', '🤖', '👥', '➕',
    '🟢', '🔵', '🟣', '🟡', '🔴', '💠', '📢', '🔗'
  ];

  const handleStartAddBtn = () => {
    setEditingBtnId(null);
    setBtnText('');
    setBtnUrl('');
    setBtnType('url');
    setBtnColor('blue');
    setBtnEmoji('💻');
    setBtnPremiumId('');
    setBtnRow((adConfig.customButtons?.length || 0) + 1);
    setBtnInGroup(true);
    setBtnInPrivate(true);
    setBtnInChannel(true);
    setIsBtnFormOpen(true);
  };

  const handleStartEditBtn = (btn: CustomButtonItem) => {
    setEditingBtnId(btn.id);
    setBtnText(btn.text);
    setBtnUrl(btn.url);
    setBtnType(btn.type);
    setBtnColor(btn.colorTheme);
    setBtnEmoji(btn.iconEmoji || '🔗');
    setBtnPremiumId(btn.premiumEmojiId || '');
    setBtnRow(btn.row || 1);
    setBtnInGroup(btn.showInGroup !== false);
    setBtnInPrivate(btn.showInPrivate !== false);
    setBtnInChannel(btn.showInChannel !== false);
    setIsBtnFormOpen(true);
  };

  const handleSaveBtnForm = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!btnText.trim()) {
      setFeedback({ type: 'error', text: 'لطفاً متن دکمه را وارد کنید.' });
      return;
    }

    let targetUrl = btnUrl.trim();
    if (btnType === 'add_to_group' && !targetUrl) {
      targetUrl = 'https://t.me/Modasr_Arzbot?startgroup=start';
    } else if (btnType === 'channel' && !targetUrl) {
      targetUrl = 'https://t.me/MODASR_ARZ';
    }

    const currentButtons = [...(adConfig.customButtons || DEFAULT_CUSTOM_BUTTONS)];

    if (editingBtnId) {
      const idx = currentButtons.findIndex((b) => b.id === editingBtnId);
      if (idx >= 0) {
        currentButtons[idx] = {
          ...currentButtons[idx],
          text: btnText.trim(),
          url: targetUrl,
          type: btnType,
          colorTheme: btnColor,
          iconEmoji: btnEmoji,
          premiumEmojiId: btnPremiumId.trim() || undefined,
          row: btnRow,
          showInGroup: btnInGroup,
          showInPrivate: btnInPrivate,
          showInChannel: btnInChannel,
        };
      }
    } else {
      const newBtn: CustomButtonItem = {
        id: `btn_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        text: btnText.trim(),
        url: targetUrl,
        type: btnType,
        colorTheme: btnColor,
        iconEmoji: btnEmoji,
        premiumEmojiId: btnPremiumId.trim() || undefined,
        isEnabled: true,
        row: btnRow,
        showInGroup: btnInGroup,
        showInPrivate: btnInPrivate,
        showInChannel: btnInChannel,
      };
      currentButtons.push(newBtn);
    }

    const updatedConfig = { ...adConfig, customButtons: currentButtons };
    setAdConfig(updatedConfig);
    setIsBtnFormOpen(false);
    setEditingBtnId(null);

    // Auto-save to backend
    try {
      setSavingAd(true);
      const res = await fetch('/api/bot/ad-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedConfig),
      });
      const data = await res.json();
      if (data?.ok) {
        setFeedback({ type: 'success', text: '✅ دکمه با موفقیت در ربات ذخیره شد.' });
      }
    } catch {
      setFeedback({ type: 'error', text: 'خطا در ثبت دکمه' });
    } finally {
      setSavingAd(false);
    }
  };

  const handleDeleteBtn = async (id: string) => {
    const updatedButtons = (adConfig.customButtons || []).filter((b) => b.id !== id);
    const updatedConfig = { ...adConfig, customButtons: updatedButtons };
    setAdConfig(updatedConfig);

    try {
      await fetch('/api/bot/ad-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedConfig),
      });
      setFeedback({ type: 'success', text: 'دکمه حذف شد.' });
    } catch {}
  };

  const handleToggleBtn = async (id: string) => {
    const updatedButtons = (adConfig.customButtons || []).map((b) =>
      b.id === id ? { ...b, isEnabled: !b.isEnabled } : b
    );
    const updatedConfig = { ...adConfig, customButtons: updatedButtons };
    setAdConfig(updatedConfig);

    try {
      await fetch('/api/bot/ad-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedConfig),
      });
    } catch {}
  };

  const handleQuickColorChange = async (id: string, color: ButtonColorTheme) => {
    const updatedButtons = (adConfig.customButtons || []).map((b) =>
      b.id === id ? { ...b, colorTheme: color } : b
    );
    const updatedConfig = { ...adConfig, customButtons: updatedButtons };
    setAdConfig(updatedConfig);

    try {
      await fetch('/api/bot/ad-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedConfig),
      });
    } catch {}
  };

  const handleSaveAdConfig = async () => {
    try {
      setSavingAd(true);
      setFeedback(null);
      const res = await fetch('/api/bot/ad-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adConfig),
      });
      const data = await res.json();
      if (data?.ok) {
        setFeedback({ type: 'success', text: '✅ تنظیمات دکمه تبلیغاتی و مقدمه پیام‌ها با موفقیت ذخیره شد.' });
      }
    } catch (e: any) {
      setFeedback({ type: 'error', text: 'خطا در ذخیره تنظیمات تبلیغ' });
    } finally {
      setSavingAd(false);
    }
  };

  const handleSaveEmojiItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.name.trim() || !editingItem.emojiTag.trim()) {
      alert('لطفاً عنوان و تگ ایموجی را وارد کنید.');
      return;
    }

    try {
      setSavingEmojiItem(true);
      setFeedback(null);
      const res = await fetch('/api/bot/emoji-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingItem),
      });
      const data = await res.json();
      if (data?.ok) {
        setFeedback({ type: 'success', text: `✅ ایموجی «${editingItem.name}» با موفقیت ذخیره شد.` });
        setIsFormOpen(false);
        setEditingItem({ name: '', key: '', emojiTag: '' });
        fetchEmojiConfig();
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'خطا در ذخیره ایموجی' });
    } finally {
      setSavingEmojiItem(false);
    }
  };

  const handleDeleteEmojiItem = async (id: string, name: string) => {
    if (!confirm(`آیا از حذف ایموجی «${name}» مطمئن هستید؟`)) return;
    try {
      setFeedback(null);
      const res = await fetch(`/api/bot/emoji-item/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data?.ok) {
        setFeedback({ type: 'success', text: `✅ ایموجی «${name}» حذف شد.` });
        fetchEmojiConfig();
      }
    } catch {
      setFeedback({ type: 'error', text: 'خطا در حذف ایموجی' });
    }
  };

  const handleResetEmojis = async () => {
    if (!confirm('آیا مایلید تمام ایموجی‌ها به حالت پیش‌فرض اولیه بازنشانی شوند؟')) return;
    try {
      setFeedback(null);
      const res = await fetch('/api/bot/emoji-reset', { method: 'POST' });
      const data = await res.json();
      if (data?.ok) {
        setFeedback({ type: 'success', text: '🔄 تمام ایموجی‌ها به تنظیمات پیش‌فرض بازنشانی شدند.' });
        fetchEmojiConfig();
      }
    } catch {
      setFeedback({ type: 'error', text: 'خطا در بازنشانی' });
    }
  };

  const handleSendBroadcast = async () => {
    if (!broadcastText.trim()) return;
    if (!confirm(`آیا از ارسال این پیام همگانی به ${usersCount} کاربر مطمئن هستید؟`)) return;

    try {
      setSendingBroadcast(true);
      setFeedback(null);
      const res = await onBroadcastMessage(broadcastText);
      if (res?.ok) {
        setFeedback({
          type: 'success',
          text: `✅ پیام با موفقیت به ${res.sentCount || 0} کاربر تلگرام ارسال شد.`,
        });
        setBroadcastText('');
      } else {
        setFeedback({ type: 'error', text: `❌ خطا در ارسال: ${res?.error || 'ناشناخته'}` });
      }
    } catch (e: any) {
      setFeedback({ type: 'error', text: e.message || 'خطا در ارسال پیام همگانی' });
    } finally {
      setSendingBroadcast(false);
    }
  };

  const parsePreviewEmoji = (val: string) => {
    if (!val) return '✨';
    const match = val.match(/!\[([^\]]*)\]/);
    if (match) return match[1];
    if (/^[0-9]+$/.test(val)) return '💎';
    return val;
  };

  return (
    <div className="space-y-6">
      
      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">کاربران خصوصی</span>
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white font-mono">{usersCount}</span>
            <span className="text-xs text-slate-400 mr-2">کاربر</span>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">گروه‌های تلگرام</span>
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white font-mono">{groupsCount}</span>
            <span className="text-xs text-slate-400 mr-2">گروه</span>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">کاربران بلاک‌شده</span>
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400">
              <UserX className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-rose-400 font-mono">{blockedCount}</span>
            <span className="text-xs text-slate-400 mr-2">کاربر</span>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">وضعیت ربات</span>
            <div
              className={`p-2.5 rounded-xl ${
                isEnabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
              }`}
            >
              <Power className="w-5 h-5" />
            </div>
          </div>
          
          <div className="mt-2 flex items-center justify-between">
            <span className={`text-xs font-bold ${isEnabled ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isEnabled ? '🟢 روشن' : '🔴 خاموش'}
            </span>
            <button
              onClick={handleToggleStatus}
              disabled={togglingStatus}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                isEnabled
                  ? 'bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/50'
                  : 'bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/50'
              }`}
            >
              {isEnabled ? 'خاموش' : 'روشن'}
            </button>
          </div>
        </div>

      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl border text-xs ${
            feedback.type === 'success'
              ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* SECTION 1: COMPREHENSIVE EMOJI MANAGER (مشاهده، افزودن، جایگزینی، حذف) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <Smile className="w-6 h-6 text-cyan-400" />
            <div>
              <h3 className="font-bold text-sm text-white">منوی مدیریت و لیست ایموجی‌های پرمیوم (Emoji Manager)</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                مشاهده ایموجی‌های ثبت‌شده، افزودن ایموجی جدید، جایگزینی یا حذف
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => setIsBulkOpen(!isBulkOpen)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-600/20 active:scale-95 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>ورود دسته‌ای ایموجی پک (Bulk Import)</span>
            </button>

            <button
              onClick={() => {
                setEditingItem({ name: '', key: 'usdt', emojiTag: '![💵](tg://emoji?id=5321231658156830001)' });
                setIsFormOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-cyan-600/20 active:scale-95 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>افزودن تکی</span>
            </button>

            <button
              onClick={handleResetEmojis}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 border border-slate-700 active:scale-95 transition-all"
              title="بازنشانی تمام ایموجی‌ها به حالت اولیه"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>بازنشانی پیش‌فرض</span>
            </button>
          </div>
        </div>

        {/* Bulk Import Box */}
        {isBulkOpen && (
          <div className="p-4 rounded-xl bg-slate-950 border border-purple-500/40 space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                <span>ورود و اعمال هوشمند تمام ایموجی‌های پرمیوم (بدون تداخل و قاطی شدن)</span>
              </span>
              <button
                type="button"
                onClick={() => setIsBulkOpen(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                ✕ بستن
              </button>
            </div>

            <div>
              <label className="text-[11px] text-slate-300 block mb-1">
                رشته تگ‌های ایموجی پرمیوم (کپی شده از تلگرام):
              </label>
              <textarea
                rows={3}
                value={bulkEmojiText}
                onChange={(e) => setBulkEmojiText(e.target.value)}
                placeholder="![🛢](tg://emoji?id=6019179941294251937)![💵](tg://emoji?id=5321231658156830001)..."
                dir="ltr"
                className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-purple-300 focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-400">
                ایموجی‌ها به صورت خودکار برای نفت، طلا، سکه، دلار، یورو، پوند، بیت‌کوین، تتر، اتریوم و سقف/کف تفکیک می‌شوند.
              </span>

              <button
                type="button"
                onClick={handleBulkImport}
                disabled={importingBulk || !bulkEmojiText.trim()}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/20 active:scale-95 transition-all disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{importingBulk ? 'در حال اعمال...' : 'اعمال و ذخیره خودکار پکیج'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Add/Edit Modal/Form */}
        {isFormOpen && (
          <form
            onSubmit={handleSaveEmojiItem}
            className="p-4 rounded-xl bg-slate-950 border border-cyan-500/40 space-y-3 animate-fadeIn"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                <Edit3 className="w-4 h-4" />
                <span>{editingItem.id ? 'ویرایش / جایگزینی ایموجی' : 'افزودن ایموجی جدید'}</span>
              </span>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                ✕ بستن
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-slate-300 block mb-1">عنوان / نام ایموجی:</label>
                <input
                  type="text"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  placeholder="مثلاً: ایموجی تتر پرمیوم"
                  className="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-300 block mb-1">کلید هدف (Key):</label>
                <input
                  type="text"
                  value={editingItem.key}
                  onChange={(e) => setEditingItem({ ...editingItem, key: e.target.value })}
                  placeholder="coin, gold, usdt, btc, toman..."
                  dir="ltr"
                  className="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-slate-100 focus:border-cyan-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-300 block mb-1">تگ مارک‌داون یا آیدی پرمیوم:</label>
                <input
                  type="text"
                  value={editingItem.emojiTag}
                  onChange={(e) => setEditingItem({ ...editingItem, emojiTag: e.target.value })}
                  placeholder="![✨](tg://emoji?id=5832577678300943429) یا آیدی عددی"
                  dir="ltr"
                  className="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-cyan-300 focus:border-cyan-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <span>پیش‌نمایش نماد:</span>
                <span className="text-base text-cyan-300 font-bold">{parsePreviewEmoji(editingItem.emojiTag)}</span>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={savingEmojiItem}
                  className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingEmojiItem ? 'در حال ذخیره...' : 'ذخیره ایموجی'}</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Search & Category Filter Controls */}
        <div className="space-y-2.5 pt-1">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                value={emojiSearch}
                onChange={(e) => setEmojiSearch(e.target.value)}
                placeholder="جستجوی سریع ارز: نام، کلید، مثلاً: سکه، btc، طلا، usdt..."
                className="w-full pr-9 pl-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none transition-colors"
              />
              {emojiSearch && (
                <button
                  onClick={() => setEmojiSearch('')}
                  className="absolute left-2.5 top-2 text-xs text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Total Count Badge */}
            <span className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700/60 self-end sm:self-auto shrink-0 font-medium">
              تعداد: {emojiConfig.items?.length || 0} ارز و دارایی
            </span>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {[
              { id: 'all', label: 'همه ارزها' },
              { id: 'crypto', label: '🪙 کریپتو' },
              { id: 'gold', label: '🥇 طلا و سکه' },
              { id: 'fiat', label: '💵 ارزهای فیات' },
              { id: 'oil', label: '🛢️ نفت و انرژی' },
              { id: 'system', label: '⚙️ علائم سیستم' },
            ].map((tab) => {
              const count =
                tab.id === 'all'
                  ? emojiConfig.items?.length || 0
                  : emojiConfig.items?.filter((x) => (x.category || 'crypto') === tab.id).length || 0;
              const isActive = selectedCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCategory(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                    isActive
                      ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-600/30'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Registered Emojis Grid / Table */}
        {(() => {
          const filteredItems = (emojiConfig.items || []).filter((item) => {
            const q = emojiSearch.trim().toLowerCase();
            const matchesSearch =
              !q ||
              item.name.toLowerCase().includes(q) ||
              item.key.toLowerCase().includes(q) ||
              item.emojiTag.toLowerCase().includes(q);

            const itemCategory = item.category || (
              ['gold', 'gold_24k', 'gold_used', 'mazaneh', 'gold_ounce', 'seke', 'seke_bahar', 'seke_nim', 'seke_rob', 'seke_gerami', 'silver', 'silver_ounce'].includes(item.key) ? 'gold' :
              ['oil_brent', 'oil_wti', 'gas'].includes(item.key) ? 'oil' :
              ['dollar', 'usd', 'eur', 'gbp', 'aed', 'try', 'cny', 'cad', 'aud', 'chf', 'usdt'].includes(item.key) ? 'fiat' :
              ['highlow', 'toman', 'up', 'down', 'plane'].includes(item.key) ? 'system' : 'crypto'
            );

            const matchesCategory = selectedCategory === 'all' || itemCategory === selectedCategory;
            return matchesSearch && matchesCategory;
          });

          if (filteredItems.length === 0) {
            return (
              <div className="p-8 text-center rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <Smile className="w-8 h-8 text-slate-500 mx-auto" />
                <p className="text-xs text-slate-400">هیچ ارزی با عبارت «{emojiSearch}» در این دسته‌بندی یافت نشد.</p>
                <button
                  onClick={() => {
                    setEmojiSearch('');
                    setSelectedCategory('all');
                  }}
                  className="text-xs text-cyan-400 hover:underline"
                >
                  نمایش تمام ارزها
                </button>
              </div>
            );
          }

          return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredItems.map((item) => {
                const preview = parsePreviewEmoji(item.emojiTag);
                const itemCategory = item.category || (
                  ['gold', 'gold_24k', 'gold_used', 'mazaneh', 'gold_ounce', 'seke', 'seke_bahar', 'seke_nim', 'seke_rob', 'seke_gerami', 'silver', 'silver_ounce'].includes(item.key) ? 'gold' :
                  ['oil_brent', 'oil_wti', 'gas'].includes(item.key) ? 'oil' :
                  ['dollar', 'usd', 'eur', 'gbp', 'aed', 'try', 'cny', 'cad', 'aud', 'chf', 'usdt'].includes(item.key) ? 'fiat' :
                  ['highlow', 'toman', 'up', 'down', 'plane'].includes(item.key) ? 'system' : 'crypto'
                );

                const categoryLabels: Record<string, { label: string; color: string }> = {
                  gold: { label: 'طلا و سکه', color: 'bg-amber-500/10 text-amber-300 border-amber-500/20' },
                  oil: { label: 'نفت و انرژی', color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' },
                  fiat: { label: 'فیات', color: 'bg-blue-500/10 text-blue-300 border-blue-500/20' },
                  crypto: { label: 'کریپتو', color: 'bg-purple-500/10 text-purple-300 border-purple-500/20' },
                  system: { label: 'سیستم', color: 'bg-slate-500/10 text-slate-300 border-slate-500/20' },
                };

                const catBadge = categoryLabels[itemCategory] || categoryLabels.crypto;

                return (
                  <div
                    key={item.id || item.key}
                    className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between gap-2.5 shadow-sm group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-xl text-cyan-400 shrink-0 shadow-inner">
                          {preview}
                        </span>
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs text-white leading-tight truncate">{item.name}</h4>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900 text-cyan-400 font-mono border border-slate-800">
                              key: {item.key}
                            </span>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded border ${catBadge.color}`}>
                              {catBadge.label}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => {
                            setEditingItem({
                              id: item.id,
                              name: item.name,
                              key: item.key,
                              emojiTag: item.emojiTag,
                            });
                            setIsFormOpen(true);
                            window.scrollTo({ top: 350, behavior: 'smooth' });
                          }}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-cyan-600 hover:text-white text-cyan-400 text-xs transition-colors border border-slate-800"
                          title="ویرایش این ارز"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteEmojiItem(item.id || item.key, item.name)}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-900/60 text-slate-400 hover:text-rose-400 text-xs transition-colors border border-slate-800"
                          title="حذف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Tag LTR display */}
                    <div className="pt-1 border-t border-slate-900 flex items-center justify-between">
                      <span className="text-[9px] text-slate-500">تگ مارک‌داون:</span>
                      <code
                        dir="ltr"
                        className="text-[10px] text-slate-300 font-mono bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800/80 max-w-[200px] truncate select-all"
                      >
                        {item.emojiTag}
                      </code>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* SECTION 2: INLINE GLASS BUTTONS, ADD-TO-GROUP, SPONSOR ADS & COLOR THEMES */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <LayersIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">مدیریت دکمه‌های شیشه‌ای تلگرام، افزودن به گروه و تبلیغات رنگی</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                  {(adConfig.customButtons || DEFAULT_CUSTOM_BUTTONS).filter(b => b.isEnabled).length} دکمه فعال
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                افزودن دکمه‌های رنگی دلخواه با لینک، دکمه افزودن ربات به گروه و پشتیبانی از ایموجی‌های پرمیوم تلگرام
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleStartAddBtn}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-600/20 transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>افزودن دکمه جدید</span>
            </button>

            <button
              onClick={handleSaveAdConfig}
              disabled={savingAd}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-700 transition-all"
            >
              <Save className={`w-3.5 h-3.5 ${savingAd ? 'animate-spin' : ''}`} />
              <span>{savingAd ? 'در حال ذخیره...' : 'ذخیره کل'}</span>
            </button>
          </div>
        </div>

        {/* Quick Spotlight Card: Add To Group Button */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-lg">
              👾
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">دکمه اختصاصی «افزودن به گروه +» (Add to Group)</span>
                <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                  CoinPJ Style
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                با این دکمه کاربران می‌توانند با یک کلیک ربات را به گروه‌های سوپرگروه و گپ‌های خود اضافه کنند.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => {
                navigator.clipboard.writeText('https://t.me/Modasr_Arzbot?startgroup=start');
                setFeedback({ type: 'success', text: '✅ لینک افزودن به گروه کپی شد: https://t.me/Modasr_Arzbot?startgroup=start' });
              }}
              className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>کپی لینک مستقیم</span>
            </button>
          </div>
        </div>

        {/* Form Modal / Expander: Add or Edit Button */}
        {isBtnFormOpen && (
          <div className="p-5 rounded-2xl bg-slate-950 border border-cyan-500/40 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-bold text-white">
                  {editingBtnId ? 'ویرایش دکمه شیشه‌ای' : 'افزودن دکمه شیشه‌ای جدید'}
                </h4>
              </div>
              <button
                onClick={() => setIsBtnFormOpen(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded-lg hover:bg-slate-800"
              >
                بستن
              </button>
            </div>

            <form onSubmit={handleSaveBtnForm} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1. Button Title */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>متن عنوان دکمه:</span>
                  </label>
                  <input
                    type="text"
                    value={btnText}
                    onChange={(e) => setBtnText(e.target.value)}
                    placeholder="مثال: خرید سرور ساعتی ↗ یا افزودن به گروه +"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:border-cyan-500 focus:outline-none"
                    required
                  />
                </div>

                {/* 2. Button Type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <LayersIcon className="w-3.5 h-3.5 text-purple-400" />
                    <span>نوع عملکرد دکمه:</span>
                  </label>
                  <select
                    value={btnType}
                    onChange={(e) => {
                      const t = e.target.value as ButtonType;
                      setBtnType(t);
                      if (t === 'add_to_group') {
                        setBtnUrl('https://t.me/Modasr_Arzbot?startgroup=start');
                        setBtnEmoji('👾');
                        setBtnColor('emerald');
                      } else if (t === 'channel') {
                        setBtnUrl('https://t.me/MODASR_ARZ');
                        setBtnEmoji('📢');
                        setBtnColor('cyan');
                      } else if (t === 'miniapp') {
                        setBtnEmoji('📱');
                        setBtnColor('emerald');
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="url">🔗 لینک تبلیغاتی / اسپانسر / وبسایت (URL Link)</option>
                    <option value="add_to_group">👾 دکمه «افزودن به گروه +» (Add to Group)</option>
                    <option value="miniapp">📱 مینی‌اپ تلگرام (mini MODASR arz)</option>
                    <option value="channel">📢 کانال تلگرام رسمی (Channel)</option>
                  </select>
                </div>

                {/* 3. Button URL */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Link className="w-3.5 h-3.5 text-cyan-400" />
                    <span>آدرس اینترنتی یا لینک مقصد (URL):</span>
                  </label>
                  <input
                    type="text"
                    value={btnUrl}
                    onChange={(e) => setBtnUrl(e.target.value)}
                    placeholder={
                      btnType === 'add_to_group'
                        ? 'https://t.me/Modasr_Arzbot?startgroup=start'
                        : 'https://t.me/MODASR_ARZ یا لینک سایت شما'
                    }
                    dir="ltr"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-cyan-300 focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                {/* 4. Color Theme Selection */}
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-amber-400" />
                      <span>انتخاب رنگ و تم دکمه (Color Themes):</span>
                    </div>
                    <span className="text-[11px] text-cyan-400 font-bold">
                      تم انتخابی: {COLOR_THEMES.find(c => c.key === btnColor)?.name}
                    </span>
                  </label>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {COLOR_THEMES.map((c) => {
                      const isSelected = btnColor === c.key;
                      return (
                        <button
                          key={c.key}
                          type="button"
                          onClick={() => setBtnColor(c.key)}
                          className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between transition-all ${
                            isSelected
                              ? `bg-gradient-to-r ${c.gradientClass} text-white border-white/40 shadow-lg scale-[1.02]`
                              : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span>{c.previewBadge}</span>
                            <span className="text-[11px] truncate">{c.name.split(' ')[0]}</span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 5. Emoji & Telegram Premium Emoji Picker */}
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Smile className="w-3.5 h-3.5 text-yellow-400" />
                      <span>آیکون ایموجی یا کد ایموجی پرمیوم تلگرام (Premium Emoji):</span>
                    </div>
                    <span className="text-[11px] text-yellow-400 font-mono">
                      ایموجی فعال: {btnEmoji}
                    </span>
                  </label>

                  {/* 24 Popular / Luxury / Crypto Emojis */}
                  <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                    {POPULAR_BUTTON_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setBtnEmoji(emoji)}
                        className={`w-8 h-8 rounded-lg text-sm flex items-center justify-center transition-all ${
                          btnEmoji === emoji
                            ? 'bg-cyan-500/30 border border-cyan-400 text-white scale-110 shadow'
                            : 'hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>

                  {/* Custom Telegram Premium Emoji Input */}
                  <div className="pt-1 flex items-center gap-2">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={btnPremiumId}
                        onChange={(e) => {
                          const val = e.target.value;
                          setBtnPremiumId(val);
                          // Auto extract emoji ID or tag
                          const match = val.match(/id=([0-9]+)/);
                          if (match) {
                            setBtnEmoji(`![💎](tg://emoji?id=${match[1]})`);
                          } else if (/^[0-9]{15,22}$/.test(val.trim())) {
                            setBtnEmoji(`![💎](tg://emoji?id=${val.trim()})`);
                          }
                        }}
                        placeholder="آیدی ایموجی پرمیوم تلگرام (مانند: 5321231658156830001 یا تگ ![💻](tg://emoji?id=...))"
                        dir="ltr"
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-300 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 6. Row Placement & Display Settings */}
                <div className="space-y-2 md:col-span-2 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-[11px] font-bold text-slate-300 block mb-2">محل نمایش و چیدمان سطر:</span>
                  
                  <div className="flex flex-wrap items-center gap-5 text-xs text-slate-300">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={btnInGroup}
                        onChange={(e) => setBtnInGroup(e.target.checked)}
                        className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
                      />
                      <span>👥 نمایش در گروه‌ها (Groups)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={btnInPrivate}
                        onChange={(e) => setBtnInPrivate(e.target.checked)}
                        className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
                      />
                      <span>💬 نمایش در چت خصوصی (Private)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={btnInChannel}
                        onChange={(e) => setBtnInChannel(e.target.checked)}
                        className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
                      />
                      <span>📢 نمایش در پست‌های کانال (Channel)</span>
                    </label>

                    <div className="flex items-center gap-2 mr-auto">
                      <span className="text-[11px] text-slate-400">شماره سطر:</span>
                      <select
                        value={btnRow}
                        onChange={(e) => setBtnRow(Number(e.target.value))}
                        className="px-2 py-1 rounded bg-slate-950 border border-slate-700 text-xs text-white"
                      >
                        <option value={1}>سطر ۱ (بالاترین)</option>
                        <option value={2}>سطر ۲</option>
                        <option value={3}>سطر ۳</option>
                        <option value={4}>سطر ۴</option>
                        <option value={5}>سطر ۵</option>
                      </select>
                    </div>
                  </div>
                </div>

              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBtnFormOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingBtnId ? 'ذخیره تغییرات دکمه' : 'افزودن دکمه'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Existing Buttons List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span>لیست دکمه‌های شیشه‌ای تعریف شده (به ترتیب سطر و نمایش):</span>
            <span className="text-[11px] text-slate-400">روی تم رنگی یا کلید فعال‌سازی کلیک کنید</span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {(adConfig.customButtons || DEFAULT_CUSTOM_BUTTONS).map((btn) => {
              const theme = COLOR_THEMES.find(c => c.key === btn.colorTheme) || COLOR_THEMES[0];
              return (
                <div
                  key={btn.id}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                    btn.isEnabled
                      ? 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                      : 'bg-slate-950/30 border-slate-900 opacity-60'
                  }`}
                >
                  {/* Left: Button Info & Color Badge */}
                  <div className="flex items-center gap-3">
                    {/* Visual Color Pill */}
                    <div className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold ${theme.bgClass} ${theme.borderClass} ${theme.textClass}`}>
                      <span>{btn.iconEmoji || theme.previewBadge}</span>
                      <span className="max-w-[160px] truncate">{btn.text}</span>
                    </div>

                    <div className="text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-slate-400 truncate max-w-[200px]">
                          {btn.url || (btn.type === 'add_to_group' ? 'startgroup=start' : 'لینک داخلی')}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-800">
                          سطر {btn.row || 1}
                        </span>
                      </div>
                      
                      {/* Scopes */}
                      <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-400">
                        {btn.showInGroup !== false && <span className="text-emerald-400">👥 گروه</span>}
                        {btn.showInPrivate !== false && <span className="text-blue-400">💬 پیوی</span>}
                        {btn.showInChannel !== false && <span className="text-purple-400">📢 کانال</span>}
                      </div>
                    </div>
                  </div>

                  {/* Right: Color Selector + Action Controls */}
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    
                    {/* Quick Color Picker Dots */}
                    <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                      {COLOR_THEMES.slice(0, 5).map((c) => (
                        <button
                          key={c.key}
                          type="button"
                          title={c.name}
                          onClick={() => handleQuickColorChange(btn.id, c.key)}
                          className={`w-4 h-4 rounded-full transition-all ${
                            btn.colorTheme === c.key ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
                          } ${
                            c.key === 'emerald' ? 'bg-emerald-500' :
                            c.key === 'blue' ? 'bg-blue-500' :
                            c.key === 'purple' ? 'bg-purple-500' :
                            c.key === 'amber' ? 'bg-amber-500' : 'bg-cyan-500'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Edit button */}
                    <button
                      onClick={() => handleStartEditBtn(btn)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
                      title="ویرایش دکمه"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDeleteBtn(btn.id)}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all"
                      title="حذف دکمه"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Active Toggle Switch */}
                    <label className="relative inline-flex items-center cursor-pointer ml-1">
                      <input
                        type="checkbox"
                        checked={btn.isEnabled}
                        onChange={() => handleToggleBtn(btn.id)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>

                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Branding & Chart Watermark Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-800">
          
          {/* Header Intro / Branding */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-purple-400" />
              <span>متن مقدمه / برندینگ بالای قیمت‌ها:</span>
            </label>
            <input
              type="text"
              value={adConfig.headerIntro}
              onChange={(e) => setAdConfig({ ...adConfig, headerIntro: e.target.value })}
              placeholder="MØD†SR.lua ᶻ z ƪARZ"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* Watermark Tag for Chart Images */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <span className="text-amber-400 text-sm">🏷</span>
              <span>واترمارک و تگ چنل روی عکس نمودار:</span>
            </label>
            <input
              type="text"
              value={adConfig.watermarkTag || '@MODASR_ARZ | MODASRP'}
              onChange={(e) => setAdConfig({ ...adConfig, watermarkTag: e.target.value })}
              placeholder="@MODASR_ARZ | MODASRP"
              dir="ltr"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-cyan-300 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* Toggle Enable Charts */}
          <div className="space-y-1.5 md:col-span-2 pt-1 flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-base">📈</span>
              <div>
                <span className="text-xs font-bold text-white block">ارسال عکس نمودار ۲۴ ساعته همراه استعلام قیمت</span>
                <span className="text-[11px] text-slate-400">تولید خودکار عکس چارت زنده با تم دارک و تگ چنل شما</span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={adConfig.enableCharts !== false}
                onChange={(e) => setAdConfig({ ...adConfig, enableCharts: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
            </label>
          </div>
        </div>

        {/* Live Visual Preview: Exactly matches Telegram Post & Buttons */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-slate-400 font-bold flex items-center gap-1.5">
              <span>📱</span>
              <span>پیش‌نمایش زنده پیام و دکمه‌های رنگی در تلگرام (طرح اسکرین‌شات):</span>
            </span>
            <span className="text-[10px] text-cyan-400 font-mono">طرح واقعی داخل تلگرام</span>
          </div>
          
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs text-slate-200 font-mono leading-relaxed space-y-2.5 max-w-md mx-auto shadow-2xl">
            {adConfig.headerIntro && <div className="font-bold text-purple-300 text-sm">{adConfig.headerIntro}</div>}
            
            <div className="font-bold text-white flex items-center gap-1.5">
              <span>💎</span>
              <span>1 USDT : (تتر)</span>
            </div>
            <div className="font-bold text-emerald-400">▫️ 268,547 toman</div>
            <div className="font-bold text-slate-100">💵 $1 dollar</div>
            <div className="text-emerald-400 font-bold">🟢 +0.02%</div>
            
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300 space-y-1">
              <span className="text-cyan-400 font-bold">📊 High & Low 📊</span><br/>
              ▫️ 270,710 / 268,391 toman
            </div>

            <div className="text-[10px] text-slate-400 font-bold flex items-center justify-between">
              <span>✈️ 1405/07/13 | 13:38:46</span>
              <span className="text-cyan-400">@MODASR_ARZ</span>
            </div>

            {/* Simulated Telegram Colored Inline Buttons */}
            <div className="pt-2 space-y-1.5 font-sans">
              {(adConfig.customButtons || DEFAULT_CUSTOM_BUTTONS)
                .filter(b => b.isEnabled)
                .map((btn) => {
                  const theme = COLOR_THEMES.find(c => c.key === btn.colorTheme) || COLOR_THEMES[0];
                  
                  return (
                    <a
                      key={btn.id}
                      href={btn.url || '#'}
                      target="_blank"
                      rel="noreferrer"
                      className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all border ${
                        btn.colorTheme === 'blue'
                          ? 'bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white border-blue-400/40 hover:brightness-110'
                          : btn.colorTheme === 'emerald'
                          ? 'bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 text-white border-emerald-400/40 hover:brightness-110'
                          : btn.colorTheme === 'purple'
                          ? 'bg-gradient-to-r from-purple-700 via-purple-600 to-fuchsia-700 text-white border-purple-400/40 hover:brightness-110'
                          : btn.colorTheme === 'amber'
                          ? 'bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 text-white border-amber-300/40 hover:brightness-110'
                          : btn.colorTheme === 'rose'
                          ? 'bg-gradient-to-r from-rose-700 to-red-700 text-white border-rose-400/40 hover:brightness-110'
                          : btn.colorTheme === 'cyan'
                          ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-cyan-400/40 hover:brightness-110'
                          : 'bg-slate-800 text-slate-100 border-slate-700 hover:bg-slate-750'
                      }`}
                    >
                      <span className="text-sm">{btn.iconEmoji || theme.previewBadge}</span>
                      <span>{btn.text}</span>
                      <ExternalLink className="w-3 h-3 opacity-70 ml-1" />
                    </a>
                  );
                })}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSaveAdConfig}
            disabled={savingAd}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-amber-600/20 active:scale-95 transition-all"
          >
            <Save className={`w-4 h-4 ${savingAd ? 'animate-spin' : ''}`} />
            <span>{savingAd ? 'در حال ذخیره...' : 'ذخیره تنظیمات دکمه‌ها و تبلیغات'}</span>
          </button>
        </div>
      </div>

      {/* SECTION 3: AUTO-CHANNEL HOURLY POSTER */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">ارسال خودکار و ساعتی به کانال تلگرام (Hourly Channel Auto-Poster)</h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                  channelConfig.isEnabled
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {channelConfig.isEnabled ? `🟢 فعال (هر ${channelConfig.intervalMinutes || 60} دقیقه)` : '⚪️ غیرفعال'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                ارسال خودکار گزارش کامل قیمت‌های زنده و کارت تصویری بازار به کانال تلگرام شما هر ۱ ساعت
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={handlePostNow}
              disabled={postingNow}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95 transition-all disabled:opacity-50"
            >
              <Send className={`w-3.5 h-3.5 ${postingNow ? 'animate-spin' : ''}`} />
              <span>{postingNow ? 'در حال ارسال...' : 'ارسال آزمایشی الان به کانال 🚀'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Target Channel */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Link className="w-3.5 h-3.5 text-cyan-400" />
              <span>شناسه یا آدرس کانال:</span>
            </label>
            <input
              type="text"
              value={channelConfig.channelId}
              onChange={(e) => setChannelConfig({ ...channelConfig, channelId: e.target.value })}
              placeholder="@MODASR_ARZ"
              dir="ltr"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-cyan-300 focus:border-cyan-500 focus:outline-none"
            />
            <span className="text-[10px] text-slate-500">توجه: ربات باید ادمین کانال با دسترسی ارسال پیام باشد.</span>
          </div>

          {/* Interval */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <span className="text-amber-400">⏱</span>
              <span>دوره زمانی ارسال خودکار:</span>
            </label>
            <select
              value={channelConfig.intervalMinutes}
              onChange={(e) => setChannelConfig({ ...channelConfig, intervalMinutes: parseInt(e.target.value, 10) })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
            >
              <option value={30}>هر ۳۰ دقیقه (نیم ساعت)</option>
              <option value={60}>هر ۶۰ دقیقه (۱ ساعت کامل - استاندارد)</option>
              <option value={120}>هر ۲ ساعت</option>
              <option value={180}>هر ۳ ساعت</option>
              <option value={360}>هر ۶ ساعت</option>
            </select>
            <span className="text-[10px] text-emerald-400 font-mono">
              {channelConfig.isEnabled ? `ارسال بعدی حدوداً تا ${channelConfig.nextPostMinutes} دقیقه دیگر` : 'زمان‌بند متوقف است'}
            </span>
          </div>

          {/* Active Switch */}
          <div className="space-y-1.5 flex flex-col justify-center p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">وضعیت ارسال خودکار</span>
                <span className="text-[10px] text-slate-400">روشن یا خاموش کردن کرون‌جاب</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={channelConfig.isEnabled}
                  onChange={(e) => setChannelConfig({ ...channelConfig, isEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Live Channel Bulletin Preview */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-bold block">
              نمونه پیام و عکس خروجی که هر ۱ ساعت به کانال <span className="text-cyan-400 font-mono">{channelConfig.channelId}</span> فرستاده می‌شود:
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">Photo + Caption (3x3 Grid Card)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Image Thumbnail */}
            <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-900 flex flex-col">
              <div className="p-2 border-b border-slate-800 bg-slate-950 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>Visual Card Grid</span>
                <span>1240 × 880 PNG</span>
              </div>
              <img
                src="/api/bot/grid-preview"
                alt="Grid Overview Preview"
                className="w-full h-auto object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Formatted Text Bulletin */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-200 font-mono leading-relaxed space-y-1.5 overflow-y-auto max-h-[300px]">
              <div className="font-bold text-purple-300">{adConfig.headerIntro}</div>
              <div className="font-bold text-white">📊 گزارش زنده بازار و نرخ ارزها :</div>
              <div className="text-[10px] text-slate-400">📅 کانال رسمی {adConfig.watermarkTag}</div>
              <div className="text-slate-600">➖➖➖➖➖➖➖➖➖➖➖➖</div>
              <div className="font-bold text-emerald-400">💵 واحدهای پول ملی (اسکناس آزاد):</div>
              <div>• دلار آمریکا (USD): <span className="text-white">۲۶۸,۳۰۰</span> تومان</div>
              <div>• یورو اروپا (EUR): <span className="text-white">۳۰۲,۹۶۰</span> تومان</div>
              <div>• درهم امارات (AED): <span className="text-white">۷۳,۴۴۰</span> تومان</div>
              <div className="font-bold text-cyan-400 pt-1">🪙 ارزهای دیجیتال (Crypto):</div>
              <div>• تتر (USDT): <span className="text-white">۲۶۸,۴۹۱</span> تومان | $1.00</div>
              <div>• بیت‌کوین (BTC): <span className="text-white">$86,450</span> (~ ۲۳,۲۱۱,۵۸۰,۰۰۰ تومان)</div>
              <div>• اتریوم (ETH) | تون‌کوین (TON) | سولانا (SOL)</div>
              <div className="font-bold text-amber-400 pt-1">👑 طلا و مسکوکات:</div>
              <div>• طلای ۱۸ عیار: <span className="text-white">۲۶,۳۲۷,۸۰۰</span> تومان</div>
              <div>• سکه امامی: <span className="text-white">۲۷۱,۰۷۵,۰۰۰</span> تومان</div>
              <div className="font-bold text-sky-400 pt-1">🛢️ نفت و کامودیتی:</div>
              <div>• نفت برنت: <span className="text-white">$102.85</span> (~ ۲۷,۵۹۶,۰۰۰ تومان)</div>
              <div className="text-slate-600">➖➖➖➖➖➖➖➖➖➖➖➖</div>
              <div className="text-[10px] text-slate-400">✈️ آخرین به‌روزرسانی زنده: ساعت رسمی ایران</div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            onClick={handleSaveChannelConfig}
            disabled={savingChannelConfig}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-cyan-600/20 active:scale-95 transition-all"
          >
            <Save className={`w-4 h-4 ${savingChannelConfig ? 'animate-spin' : ''}`} />
            <span>{savingChannelConfig ? 'در حال ذخیره...' : 'ذخیره تنظیمات ارسال خودکار'}</span>
          </button>
        </div>
      </div>

      {/* SECTION 3.5: ADMIN PRIVATE ERROR & BUG ALERT SYSTEM (ارسال خطاها به پیوی ادمین) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">سامانه هوشمند گزارش خطا و باگ به پیوی ادمین (Admin Alerts)</h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                  alertConfig.isEnabled
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {alertConfig.isEnabled ? '🟢 اعلان مستقیم فعال' : '⚪️ غیرفعال'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                ارسال خودکار و لحظه‌ای تمام خطاهای سیستمی، قطعی API نرخ‌ها و گزارش‌های باگ کاربران به پیوی تلگرام شما
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={handleTestAlert}
              disabled={testingAlert}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all"
              title="ارسال پیام تستی به پیوی ادمین"
            >
              <Bell className={`w-3.5 h-3.5 ${testingAlert ? 'animate-bounce' : ''}`} />
              <span>{testingAlert ? 'در حال ارسال تست...' : 'ارسال پیام تست به پیوی'}</span>
            </button>
          </div>
        </div>

        {/* Master Switch & Admin ID Form */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white block">فعال‌سازی ارسال خطا به پیوی</span>
              <span className="text-[10px] text-slate-400">دریافت لحظه‌ای نوتیفیکیشن خطاها در تلگرام</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={alertConfig.isEnabled}
                onChange={(e) => setAlertConfig({ ...alertConfig, isEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
            </label>
          </div>

          <div className="space-y-1.5 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>شناسه عددی ادمین (Admin Chat ID):</span>
              <span className="text-[10px] text-cyan-400 font-mono">پیش‌فرض: 1355650097</span>
            </label>
            <input
              type="text"
              value={alertConfig.adminId}
              onChange={(e) => setAlertConfig({ ...alertConfig, adminId: e.target.value })}
              placeholder="مثال: 1355650097"
              dir="ltr"
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-slate-100 focus:border-rose-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Granular Notification Triggers */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 space-y-3">
          <span className="text-xs font-bold text-white block border-b border-slate-800 pb-2">
            انتخاب دسته‌بندی خطاهایی که می‌خواهید در پیوی دریافت کنید:
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <label className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 cursor-pointer hover:border-slate-700 transition-all">
              <input
                type="checkbox"
                checked={alertConfig.notifyOnTelegramErrors}
                onChange={(e) => setAlertConfig({ ...alertConfig, notifyOnTelegramErrors: e.target.checked })}
                className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-rose-500 focus:ring-rose-500"
              />
              <div>
                <span className="font-semibold text-slate-200 block">خطاهای ارسال تلگرام</span>
                <span className="text-[10px] text-slate-400">بلاک شدن ربات، محدودیت دسترسی در گروه، رد تصویر</span>
              </div>
            </label>

            <label className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 cursor-pointer hover:border-slate-700 transition-all">
              <input
                type="checkbox"
                checked={alertConfig.notifyOnApiErrors}
                onChange={(e) => setAlertConfig({ ...alertConfig, notifyOnApiErrors: e.target.checked })}
                className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-rose-500 focus:ring-rose-500"
              />
              <div>
                <span className="font-semibold text-slate-200 block">خطاهای وب‌سرویس قیمت‌ها</span>
                <span className="text-[10px] text-slate-400">قطعی نوبیتکس، فست‌کریت، قیمت طلا یا تتر</span>
              </div>
            </label>

            <label className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 cursor-pointer hover:border-slate-700 transition-all">
              <input
                type="checkbox"
                checked={alertConfig.notifyOnChannelErrors}
                onChange={(e) => setAlertConfig({ ...alertConfig, notifyOnChannelErrors: e.target.checked })}
                className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-rose-500 focus:ring-rose-500"
              />
              <div>
                <span className="font-semibold text-slate-200 block">خطاهای ارسال به کانال</span>
                <span className="text-[10px] text-slate-400">ناموفق بودن ارسال خودکار بولتن ساعتی به کانال</span>
              </div>
            </label>

            <label className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 cursor-pointer hover:border-slate-700 transition-all">
              <input
                type="checkbox"
                checked={alertConfig.notifyOnUserBugReports}
                onChange={(e) => setAlertConfig({ ...alertConfig, notifyOnUserBugReports: e.target.checked })}
                className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-cyan-500"
              />
              <div>
                <span className="font-semibold text-slate-200 block">گزارش باگ کاربران (/report)</span>
                <span className="text-[10px] text-slate-400">پیام‌ها و باگ‌هایی که کاربران با دستور /report می‌فرستند</span>
              </div>
            </label>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-1">
          <button
            onClick={handleSaveAlertConfig}
            disabled={savingAlert}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-rose-600/20 active:scale-95 transition-all"
          >
            <Save className={`w-4 h-4 ${savingAlert ? 'animate-spin' : ''}`} />
            <span>{savingAlert ? 'در حال ذخیره...' : 'ذخیره تنظیمات سیستم هشدار ادمین'}</span>
          </button>
        </div>
      </div>

      {/* SECTION 4: BROADCAST MESSAGE TOOL */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-sm text-white">ارسال پیام همگانی به تمام کاربران (Broadcast)</h3>
          </div>
          <span className="text-xs text-slate-400">فرمت: HTML / Text</span>
        </div>

        <div className="space-y-2">
          <textarea
            rows={3}
            value={broadcastText}
            onChange={(e) => setBroadcastText(e.target.value)}
            placeholder="متن پیام همگانی خود را اینجا بنویسید..."
            className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSendBroadcast}
            disabled={sendingBroadcast || !broadcastText.trim()}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-cyan-600/20 active:scale-95 transition-all disabled:opacity-50"
          >
            <Send className={`w-4 h-4 ${sendingBroadcast ? 'animate-spin' : ''}`} />
            <span>{sendingBroadcast ? 'در حال ارسال همگانی...' : 'ارسال به تمام کاربران'}</span>
          </button>
        </div>
      </div>

    </div>
  );
};
