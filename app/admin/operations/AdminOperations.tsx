/* eslint-disable @next/next/no-img-element */
'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState, useRef } from 'react';
import {
  ArrowLeft,
  Bell,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  MessageSquare,
  Pencil,
  RefreshCw,
  Settings2,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Plus,
  Upload,
  X,
  Check,
  AlertTriangle,
  HardHat,
  Flame,
  CloudRain,
  HeartPulse,
  Zap,
  ShieldAlert,
  ShieldCheck,
  MoveUp,
  MoveDown
} from 'lucide-react';
import { DEFAULT_SAFETY_SLIDES, type SafetySlideData, type BadgeTone } from '@/lib/safetyCards';
import { HAZARD_TYPES } from '@/lib/locationConfig';

type Data = {
  flags: Record<string, boolean>;
  definitions: Record<string, { label: string }>;
  feedbackCount: number;
  feedback: Array<{
    id: string;
    name: string | null;
    email: string | null;
    category: string;
    rating: number;
    area: string | null;
    message: string;
    createdAt: string;
  }>;
  announcements: Array<{ id: string; title: string; message: string; active: boolean; createdAt: string }>;
  logs: Array<{ id: string; action: string; detail: string | null; adminEmail: string; createdAt: string }>;
  safetyCards?: SafetySlideData[];
  directVending: { enabled: boolean; approved: boolean; credentialsConfigured: boolean; message: string };
};

const PRESET_ICONS = [
  { name: 'HardHat', label: 'Engineer Hard Hat', icon: HardHat },
  { name: 'CloudRain', label: 'Rain / Storm', icon: CloudRain },
  { name: 'Flame', label: 'Fire / Transformer', icon: Flame },
  { name: 'ShieldAlert', label: 'Safety Warning', icon: ShieldAlert },
  { name: 'HeartPulse', label: 'First Aid / Medic', icon: HeartPulse },
  { name: 'Zap', label: 'High Voltage', icon: Zap },
  { name: 'AlertTriangle', label: 'Danger Triangle', icon: AlertTriangle },
  { name: 'ShieldCheck', label: 'Verified Shield', icon: ShieldCheck }
];


/**
 * Resizes and crops any uploaded photo into an optimized square thumbnail
 * (140x140px, webp/jpeg, typically 3KB - 9KB) for fast app loading.
 */
async function resizeAvatarImage(file: File, size = 140, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const minDim = Math.min(img.width, img.height);
        const startX = (img.width - minDim) / 2;
        const startY = (img.height - minDim) / 2;

        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, size, size);

        try {
          const dataUrl = canvas.toDataURL('image/webp', quality);
          resolve(dataUrl);
        } catch {
          resolve(canvas.toDataURL('image/jpeg', quality));
        }
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function AdminOperations({ adminEmail, isSuperAdmin }: { adminEmail: string; isSuperAdmin: boolean }) {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingMessage, setEditingMessage] = useState('');
  const [auditLogOpen, setAuditLogOpen] = useState(false);
  const [feedbackFilter, setFeedbackFilter] = useState<'all' | 'excited' | 'happy' | 'sad'>('all');
  const [feedbackPage, setFeedbackPage] = useState(1);
  const [feedbackPageSize, setFeedbackPageSize] = useState(6);

  // Safety Cards State
  const [safetyCards, setSafetyCards] = useState<SafetySlideData[]>(DEFAULT_SAFETY_SLIDES);
  const [editingCard, setEditingCard] = useState<SafetySlideData | null>(null);
  const [isCreatingCard, setIsCreatingCard] = useState(false);
  const [isResizingAvatar, setIsResizingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const load = useCallback(async () => {
    const response = await fetch('/api/admin/operations', { cache: 'no-store', credentials: 'same-origin' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Could not load operations data.');
    setData(result);
    if (Array.isArray(result.safetyCards) && result.safetyCards.length > 0) {
      setSafetyCards(result.safetyCards);
    }
  }, []);

  useEffect(() => {
    void load().catch((err) => setError(err.message));
  }, [load]);

  const perform = async (body: Record<string, unknown>, key: string) => {
    setBusy(key);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch('/api/admin/operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(body)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Operation failed.');
      if (body.action === 'create-announcement') {
        setTitle('');
        setMessage('');
      }
      if (body.action === 'update-announcement') setEditingAnnouncementId(null);
      if (body.action === 'set-flag' && result.flags) {
        setData((current) => (current ? { ...current, flags: result.flags } : current));
      }
      if (body.action === 'save-safety-cards' && Array.isArray(result.safetyCards)) {
        setSafetyCards(result.safetyCards);
        setEditingCard(null);
        setIsCreatingCard(false);
      }
      if (body.action === 'reset-safety-cards' && Array.isArray(result.safetyCards)) {
        setSafetyCards(result.safetyCards);
        setEditingCard(null);
        setIsCreatingCard(false);
      }
      setSuccess(
        body.action === 'create-announcement'
          ? 'Announcement is now live in the app.'
          : body.action === 'save-safety-cards'
          ? 'Safety cards updated and published live.'
          : body.action === 'reset-safety-cards'
          ? 'Safety cards restored to official EDSA defaults.'
          : 'Operations control updated.'
      );
      void load().catch(() => undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operation failed.');
    } finally {
      setBusy(null);
    }
  };

  const beginEditingAnnouncement = (announcement: Data['announcements'][number]) => {
    setEditingAnnouncementId(announcement.id);
    setEditingTitle(announcement.title);
    setEditingMessage(announcement.message);
  };

  const deleteAnnouncement = (id: string, title: string) => {
    if (window.confirm(`Delete the announcement "${title}"? This cannot be undone.`)) {
      void perform({ action: 'delete-announcement', id }, `delete-${id}`);
    }
  };

  const clearAuditLog = () => {
    if (window.confirm('Clear every admin activity entry? This cannot be undone.')) {
      void perform({ action: 'clear-audit-log' }, 'clear-audit-log');
    }
  };

  const deleteFeedback = (id: string) => {
    if (window.confirm('Delete this feedback item? This cannot be undone.')) {
      void perform({ action: 'delete-feedback', id }, `delete-fb-${id}`);
    }
  };

  // --- Safety Card Handlers ---

  const handleAvatarFileSelection = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingCard) return;

    try {
      setIsResizingAvatar(true);
      setAvatarError(null);
      const optimizedDataUrl = await resizeAvatarImage(file, 140, 0.82);
      setEditingCard((prev) => (prev ? { ...prev, avatarImage: optimizedDataUrl } : null));
    } catch (err) {
      console.error('Failed to resize avatar photo:', err);
      setAvatarError('Could not process this image. Please try a different PNG/JPG photo.');
    } finally {
      setIsResizingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = () => {
    if (!editingCard) return;
    setEditingCard({ ...editingCard, avatarImage: null });
  };

  const handleAddNewCard = () => {
    const newCard: SafetySlideData = {
      id: `card-${Date.now()}`,
      badge: 'Safety Alert',
      badgeTone: 'blue',
      speaker: 'EDSA Field Officer',
      speakerRole: 'Public Safety Directorate',
      avatarIconName: 'HardHat',
      avatarBg: 'from-blue-600 to-indigo-700',
      title: 'New Electrical Safety Guidance',
      guidance: 'Explain the specific hazard, distance requirements, and steps to keep the community safe.',
      keyPoints: [
        'Keep safe distance from exposed electrical components',
        'Do not touch or attempt DIY repairs on utility poles',
        'Report incident immediately via this mobile platform'
      ],
      actionLabel: 'Report Hazard Now',
      hazardType: 'Cut or damaged Wires',
      active: true,
      order: safetyCards.length
    };
    setEditingCard(newCard);
    setIsCreatingCard(true);
  };

  const handleSaveEditedCard = () => {
    if (!editingCard) return;
    if (!editingCard.title.trim()) {
      setError('Card title is required.');
      return;
    }
    if (!editingCard.speaker.trim()) {
      setError('Speaker / Authority name is required.');
      return;
    }

    let updatedList: SafetySlideData[];
    if (isCreatingCard) {
      updatedList = [...safetyCards, { ...editingCard, order: safetyCards.length }];
    } else {
      updatedList = safetyCards.map((c) => (c.id === editingCard.id ? editingCard : c));
    }

    // Re-index orders
    updatedList = updatedList.map((c, idx) => ({ ...c, order: idx }));
    void perform({ action: 'save-safety-cards', cards: updatedList }, 'save-card');
  };

  const handleDeleteCard = (cardId: string, cardTitle: string) => {
    if (!window.confirm(`Delete safety card "${cardTitle}"?`)) return;
    const remaining = safetyCards.filter((c) => c.id !== cardId).map((c, idx) => ({ ...c, order: idx }));
    void perform({ action: 'save-safety-cards', cards: remaining }, `del-card-${cardId}`);
  };

  const handleToggleCardActive = (cardId: string) => {
    const updated = safetyCards.map((c) => (c.id === cardId ? { ...c, active: !c.active } : c));
    void perform({ action: 'save-safety-cards', cards: updated }, `toggle-card-${cardId}`);
  };

  const handleMoveCard = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= safetyCards.length) return;

    const copy = [...safetyCards];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;

    const reordered = copy.map((c, idx) => ({ ...c, order: idx }));
    void perform({ action: 'save-safety-cards', cards: reordered }, 'reorder-cards');
  };

  const handleResetToDefaults = () => {
    if (window.confirm('Reset all safety cards back to the 5 official EDSA guidelines? Custom cards will be replaced.')) {
      void perform({ action: 'reset-safety-cards' }, 'reset-safety-cards');
    }
  };

  if (!data) {
    return (
      <main className="min-h-screen bg-slate-950 p-8 text-white">
        <p>{error || 'Loading operations console...'}</p>
      </main>
    );
  }

  const getFeedbackSentiment = (item: Data['feedback'][number]) => {
    const cat = (item.category || '').toLowerCase();
    const msg = (item.message || '').toLowerCase();
    if (item.rating === 5 || cat.includes('excited') || msg.includes('🤩') || msg.includes('excited')) return 'excited';
    if (item.rating === 4 || cat.includes('happy') || msg.includes('😊') || msg.includes('happy')) return 'happy';
    if (item.rating <= 2 || cat.includes('sad') || msg.includes('😞') || msg.includes('sad')) return 'sad';
    return 'happy';
  };

  const totalFeedbackCount = data.feedback.length;
  const excitedCount = data.feedback.filter((i) => getFeedbackSentiment(i) === 'excited').length;
  const happyCount = data.feedback.filter((i) => getFeedbackSentiment(i) === 'happy').length;
  const sadCount = data.feedback.filter((i) => getFeedbackSentiment(i) === 'sad').length;

  const filteredFeedback =
    feedbackFilter === 'all' ? data.feedback : data.feedback.filter((i) => getFeedbackSentiment(i) === feedbackFilter);

  const totalFilteredCount = filteredFeedback.length;
  const totalPages = Math.max(1, Math.ceil(totalFilteredCount / feedbackPageSize));
  const safePage = Math.min(Math.max(1, feedbackPage), totalPages);
  const startIndex = (safePage - 1) * feedbackPageSize;
  const endIndex = Math.min(startIndex + feedbackPageSize, totalFilteredCount);
  const paginatedFeedback = filteredFeedback.slice(startIndex, endIndex);

  const handleFilterChange = (filter: 'all' | 'excited' | 'happy' | 'sad') => {
    setFeedbackFilter(filter);
    setFeedbackPage(1);
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white md:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-blue-400">Operations Command Center</p>
            <h1 className="mt-1 text-2xl font-black">App Controls & Education Management</h1>
            <p className="mt-1 text-sm text-gray-400">Signed in as {adminEmail}</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin" className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/5">
              <ArrowLeft className="h-4 w-4" /> Dashboard
            </Link>
            <Link href="/admin/incidents" className="rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/5">
              Incident queue
            </Link>
            <button onClick={() => void load()} className="rounded-lg border border-white/10 p-2 hover:bg-white/5" aria-label="Refresh">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </header>

        {error && <p className="rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
        {success && <p className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">{success}</p>}

        {/* Feature Flags */}
        <section className="grid gap-4 md:grid-cols-3">
          {Object.entries(data.definitions).map(([key, definition]) => (
            <button
              key={key}
              onClick={() => void perform({ action: 'set-flag', key, enabled: !data.flags[key] }, key)}
              disabled={busy === key}
              className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] p-5 text-left hover:bg-white/[0.06] disabled:opacity-60"
            >
              <span>
                <Settings2 className="mb-3 h-5 w-5 text-blue-400" />
                <span className="block font-bold">{definition.label}</span>
                <span className="text-xs text-gray-400">
                  {data.flags[key] ? 'Enabled in the app' : 'Temporarily disabled'}
                </span>
              </span>
              {data.flags[key] ? <ToggleRight className="h-8 w-8 text-emerald-400" /> : <ToggleLeft className="h-8 w-8 text-gray-500" />}
            </button>
          ))}
        </section>

        {/* ========================================================================= */}
        {/* EDUCATIONAL SAFETY CARDS MANAGEMENT PANEL */}
        {/* ========================================================================= */}
        <section className="rounded-2xl border border-blue-500/20 bg-blue-950/[0.12] p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-blue-400" />
                <h2 className="text-xl font-bold text-white">Educational Safety Cards ({safetyCards.length})</h2>
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Control the sliding danger education card on the live tracker: upload avatars, edit lessons, reorder, or delete cards.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddNewCard}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all active:scale-95"
              >
                <Plus className="h-3.5 w-3.5" /> Add New Card
              </button>
              <button
                type="button"
                onClick={handleResetToDefaults}
                disabled={busy === 'reset-safety-cards'}
                className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-xs transition-all disabled:opacity-50"
                title="Restore original 5 EDSA lessons"
              >
                Reset to Defaults
              </button>
            </div>
          </div>

          {/* Cards List */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {safetyCards.map((card, idx) => {
              const tone = card.badgeTone || 'blue';
              const isFirst = idx === 0;
              const isLast = idx === safetyCards.length - 1;

              return (
                <div
                  key={card.id}
                  className={`rounded-2xl border p-4 space-y-3 transition-all ${
                    card.active
                      ? 'border-white/10 bg-white/[0.03] hover:border-blue-400/30'
                      : 'border-white/5 bg-black/40 opacity-60'
                  }`}
                >
                  {/* Top Bar: Avatar, Speaker & Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 p-0.5 overflow-hidden shrink-0 shadow-sm">
                        {card.avatarImage ? (
                          <img src={card.avatarImage} alt={card.speaker} className="w-full h-full object-cover rounded-[0.625rem] bg-white" />
                        ) : (
                          <div className="w-full h-full bg-slate-900 rounded-[0.625rem] flex items-center justify-center">
                            <HardHat className="w-5 h-5 text-blue-400" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-black text-white leading-tight">{card.speaker}</p>
                        <p className="text-[10px] text-gray-400 leading-tight mt-0.5">{card.speakerRole}</p>
                      </div>
                    </div>

                    <span
                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                        card.active
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                          : 'bg-gray-800 text-gray-400 border-gray-700'
                      }`}
                    >
                      {card.active ? 'Live' : 'Hidden'}
                    </span>
                  </div>

                  {/* Card Title & Badge */}
                  <div>
                    <span
                      className={`inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border mb-1.5 ${
                        tone === 'rose'
                          ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                          : tone === 'amber'
                          ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                          : tone === 'emerald'
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                          : tone === 'purple'
                          ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                          : 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                      }`}
                    >
                      {card.badge}
                    </span>
                    <h3 className="text-sm font-bold text-white line-clamp-1">{card.title}</h3>
                    <p className="mt-1 text-xs text-gray-400 line-clamp-2 leading-relaxed">{card.guidance}</p>
                  </div>

                  {/* Hazard Link Pill */}
                  <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1 border-t border-white/5">
                    <span className="truncate">🎯 {card.hazardType || 'General Hazard'}</span>
                    <span className="text-[10px] text-gray-500 font-mono">#{idx + 1}</span>
                  </div>

                  {/* Action Controls */}
                  <div className="flex items-center justify-between gap-1 pt-1">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveCard(idx, 'up')}
                        disabled={isFirst}
                        className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move slide up"
                      >
                        <MoveUp className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveCard(idx, 'down')}
                        disabled={isLast}
                        className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move slide down"
                      >
                        <MoveDown className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleCardActive(card.id)}
                        className="px-2 py-1 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-[11px] text-gray-300 font-medium"
                      >
                        {card.active ? 'Hide' : 'Show'}
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCard({ ...card });
                          setIsCreatingCard(false);
                        }}
                        className="p-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30"
                        title="Edit Card"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCard(card.id, card.title)}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30"
                        title="Delete Card"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ========================================================================= */}
          {/* CARD EDITOR MODAL / FORM */}
          {/* ========================================================================= */}
          {editingCard && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
              <div className="w-full max-w-2xl rounded-2xl border border-white/15 bg-slate-900 p-6 space-y-5 text-white shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-blue-400" />
                    <h3 className="font-bold text-lg">
                      {isCreatingCard ? 'Create Educational Safety Card' : 'Edit Educational Safety Card'}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCard(null);
                      setIsCreatingCard(false);
                    }}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Avatar Upload & Resizing Section */}
                <div className="rounded-xl border border-blue-500/30 bg-blue-950/20 p-4 space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-blue-300">
                    Avatar Photo & Profile Image (Auto-Resized for Low Bandwidth)
                  </label>

                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    {/* Square Preview */}
                    <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-0.5 shadow-md shrink-0 overflow-hidden">
                      {editingCard.avatarImage ? (
                        <img
                          src={editingCard.avatarImage}
                          alt="Avatar preview"
                          className="w-full h-full object-cover rounded-[0.875rem] bg-white"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-900 rounded-[0.875rem] flex items-center justify-center">
                          <HardHat className="w-9 h-9 text-blue-400" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 flex-1 text-center sm:text-left">
                      <p className="text-xs text-gray-300">
                        Upload any speaker or technician photo. Our engine automatically crops and compresses it to a lightweight 140x140 square thumbnail (&lt;10KB) to ensure high-speed mobile loading.
                      </p>

                      <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarFileSelection}
                          className="hidden"
                          id="avatar-photo-upload"
                        />
                        <label
                          htmlFor="avatar-photo-upload"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer shadow-sm active:scale-95"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          {isResizingAvatar ? 'Resizing...' : 'Upload & Resize Photo'}
                        </label>

                        {editingCard.avatarImage && (
                          <button
                            type="button"
                            onClick={handleRemoveAvatar}
                            className="px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-medium text-gray-300"
                          >
                            Remove Photo
                          </button>
                        )}
                      </div>
                      {avatarError && <p className="text-xs text-rose-400 font-semibold">{avatarError}</p>}
                    </div>
                  </div>
                </div>

                {/* Speaker Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-gray-400">Speaker / Authority Name</label>
                    <input
                      value={editingCard.speaker}
                      onChange={(e) => setEditingCard({ ...editingCard, speaker: e.target.value })}
                      placeholder="e.g. Eng. Osman Kamara"
                      className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-gray-400">Role / Department</label>
                    <input
                      value={editingCard.speakerRole}
                      onChange={(e) => setEditingCard({ ...editingCard, speakerRole: e.target.value })}
                      placeholder="e.g. Senior Grid Safety Specialist"
                      className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white"
                    />
                  </div>
                </div>

                {/* Title & Badge */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs font-bold uppercase text-gray-400">Card Title</label>
                    <input
                      value={editingCard.title}
                      onChange={(e) => setEditingCard({ ...editingCard, title: e.target.value })}
                      placeholder="e.g. Fallen Cables & Ground Voltage Shock"
                      className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-gray-400">Badge Text</label>
                    <input
                      value={editingCard.badge}
                      onChange={(e) => setEditingCard({ ...editingCard, badge: e.target.value })}
                      placeholder="e.g. High Voltage Hazard"
                      className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white"
                    />
                  </div>
                </div>

                {/* Badge Tone & Icon Presets */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-gray-400">Badge Color Tone</label>
                    <select
                      value={editingCard.badgeTone}
                      onChange={(e) => setEditingCard({ ...editingCard, badgeTone: e.target.value as BadgeTone })}
                      className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white"
                    >
                      <option value="blue">Blue (Standard Safety)</option>
                      <option value="rose">Rose (Immediate Danger)</option>
                      <option value="amber">Amber (Equipment Caution)</option>
                      <option value="emerald">Emerald (Life-Saving / Protocol)</option>
                      <option value="purple">Purple (Grid Compliance)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-gray-400">Fallback Icon</label>
                    <select
                      value={editingCard.avatarIconName || 'HardHat'}
                      onChange={(e) => setEditingCard({ ...editingCard, avatarIconName: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white"
                    >
                      {PRESET_ICONS.map((p) => (
                        <option key={p.name} value={p.name}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Guidance Textarea */}
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-gray-400">Educational Guidance Description</label>
                  <textarea
                    value={editingCard.guidance}
                    onChange={(e) => setEditingCard({ ...editingCard, guidance: e.target.value })}
                    rows={3}
                    placeholder="Clear, life-saving advice for citizens..."
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white leading-relaxed"
                  />
                </div>

                {/* 3 Key Points */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-gray-400">Actionable Checklist Points (3 max)</label>
                  {[0, 1, 2].map((idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-500 font-mono w-5">#{idx + 1}</span>
                      <input
                        value={editingCard.keyPoints[idx] || ''}
                        onChange={(e) => {
                          const pts = [...(editingCard.keyPoints || [])];
                          pts[idx] = e.target.value;
                          setEditingCard({ ...editingCard, keyPoints: pts.filter(Boolean) });
                        }}
                        placeholder={`Safety rule ${idx + 1}...`}
                        className="flex-1 rounded-xl border border-white/10 bg-slate-950 px-3 py-1.5 text-xs text-white"
                      />
                    </div>
                  ))}
                </div>

                {/* Action Button & Hazard Mapping */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/10">
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-gray-400">Action Button Label</label>
                    <input
                      value={editingCard.actionLabel}
                      onChange={(e) => setEditingCard({ ...editingCard, actionLabel: e.target.value })}
                      placeholder="e.g. Report Fallen Wire"
                      className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-gray-400">Target Hazard Category to Open</label>
                    <select
                      value={editingCard.hazardType || HAZARD_TYPES[0]}
                      onChange={(e) => setEditingCard({ ...editingCard, hazardType: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white"
                    >
                      {HAZARD_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Modal Footer Controls */}
                <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCard(null);
                      setIsCreatingCard(false);
                    }}
                    className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEditedCard}
                    disabled={busy === 'save-card'}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/25 active:scale-95 disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    {busy === 'save-card' ? 'Saving...' : 'Save & Publish Card'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Direct Vending Readiness */}
        <section className="rounded-lg border border-[#040e40]/20 bg-[#040e40]/[0.06] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-white">Direct EDSA vending readiness</p>
              <p className="mt-1 text-xs text-gray-400">{data.directVending.message}</p>
            </div>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-bold ${
                data.directVending.enabled
                  ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300'
                  : 'border-[#040e40]/30 bg-[#040e40]/15 text-blue-200'
              }`}
            >
              {data.directVending.enabled ? 'Ready' : 'Not live'}
            </span>
          </div>
        </section>

        {/* Announcements & Feedback Grid */}
        <section className="grid gap-6 lg:grid-cols-2">
          {/* Announcements */}
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-6">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-400" />
              <h2 className="font-bold">Send in-app announcement</h2>
            </div>
            {isSuperAdmin ? (
              <div className="mt-5 space-y-3">
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  maxLength={120}
                  placeholder="Announcement title"
                  className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm"
                />
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  maxLength={500}
                  placeholder="Message for all app users"
                  className="min-h-28 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm"
                />
                <button
                  disabled={!title.trim() || !message.trim() || busy === 'announcement'}
                  onClick={() => void perform({ action: 'create-announcement', title, message }, 'announcement')}
                  className="rounded-lg bg-[#040e40] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                >
                  {busy === 'announcement' ? 'Sending...' : 'Publish announcement'}
                </button>
              </div>
            ) : (
              <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.03] p-4 flex items-start gap-3">
                <span className="text-xl shrink-0">🔒</span>
                <div>
                  <p className="text-sm font-semibold text-gray-300">Super admin access required</p>
                  <p className="mt-1 text-xs text-gray-500">
                    Publishing announcements is restricted to super administrators. You can view and manage existing announcements below.
                  </p>
                </div>
              </div>
            )}
            <div className="mt-6 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Announcement history</h3>
              {data.announcements.map((item) =>
                editingAnnouncementId === item.id ? (
                  <div key={item.id} className="space-y-3 rounded-lg border border-[#040e40]/30 bg-[#040e40]/[0.06] p-3">
                    <input
                      value={editingTitle}
                      onChange={(event) => setEditingTitle(event.target.value)}
                      maxLength={120}
                      className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm"
                    />
                    <textarea
                      value={editingMessage}
                      onChange={(event) => setEditingMessage(event.target.value)}
                      maxLength={500}
                      className="min-h-24 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm"
                    />
                    <div className="flex gap-2">
                      <button
                        disabled={!editingTitle.trim() || !editingMessage.trim() || busy === `edit-${item.id}`}
                        onClick={() =>
                          void perform(
                            { action: 'update-announcement', id: item.id, title: editingTitle, message: editingMessage },
                            `edit-${item.id}`
                          )
                        }
                        className="rounded-lg bg-[#040e40] px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                      >
                        Save changes
                      </button>
                      <button onClick={() => setEditingAnnouncementId(null)} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-gray-300">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div key={item.id} className="rounded-lg bg-black/20 p-3 text-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-white">
                          {item.title}
                          <span className={`ml-2 text-xs ${item.active ? 'text-emerald-400' : 'text-gray-500'}`}>
                            {item.active ? 'Live' : 'Hidden'}
                          </span>
                        </p>
                        <p className="mt-1 text-xs text-gray-400">{item.message}</p>
                        <p className="mt-2 text-[10px] text-gray-600">{new Date(item.createdAt).toLocaleString()}</p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button
                          onClick={() => beginEditingAnnouncement(item)}
                          className="rounded-md p-1.5 text-gray-400 hover:bg-white/10 hover:text-white"
                          title="Edit announcement"
                          aria-label="Edit announcement"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => deleteAnnouncement(item.id, item.title)}
                          disabled={busy === `delete-${item.id}`}
                          className="rounded-md p-1.5 text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                          title="Delete announcement"
                          aria-label="Delete announcement"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => void perform({ action: 'set-announcement-status', id: item.id, active: !item.active }, item.id)}
                      className="mt-3 text-xs font-bold text-blue-300"
                    >
                      {item.active ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                )
              )}
              {data.announcements.length === 0 && <p className="text-sm text-gray-500">No announcements have been created.</p>}
            </div>
          </div>

          {/* Feedback Moderation */}
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-6 space-y-5">
            <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-400" />
                <h2 className="font-bold text-lg">Citizen Feedback Inbox ({data.feedbackCount})</h2>
              </div>
            </div>

            {/* Emoji Sentiment Overview Cards */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="rounded-xl border border-[#040e40]/30 bg-[#040e40]/15 p-3 text-center">
                <span className="text-2xl">🤩</span>
                <p className="mt-1 text-xs font-bold text-blue-300">Excited</p>
                <p className="text-lg font-black text-white">{excitedCount}</p>
                <p className="text-[10px] text-gray-400">
                  {totalFeedbackCount ? Math.round((excitedCount / totalFeedbackCount) * 100) : 0}%
                </p>
              </div>

              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-center">
                <span className="text-2xl">😊</span>
                <p className="mt-1 text-xs font-bold text-emerald-300">Happy</p>
                <p className="text-lg font-black text-white">{happyCount}</p>
                <p className="text-[10px] text-gray-400">
                  {totalFeedbackCount ? Math.round((happyCount / totalFeedbackCount) * 100) : 0}%
                </p>
              </div>

              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-center">
                <span className="text-2xl">😞</span>
                <p className="mt-1 text-xs font-bold text-rose-300">Sad</p>
                <p className="text-lg font-black text-white">{sadCount}</p>
                <p className="text-[10px] text-gray-400">
                  {totalFeedbackCount ? Math.round((sadCount / totalFeedbackCount) * 100) : 0}%
                </p>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => handleFilterChange('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  feedbackFilter === 'all'
                    ? 'bg-[#040e40] text-white shadow-sm'
                    : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'
                }`}
              >
                All ({totalFeedbackCount})
              </button>
              <button
                type="button"
                onClick={() => handleFilterChange('excited')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  feedbackFilter === 'excited'
                    ? 'bg-[#040e40]/30 border border-[#040e40] text-blue-300'
                    : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'
                }`}
              >
                🤩 Excited ({excitedCount})
              </button>
              <button
                type="button"
                onClick={() => handleFilterChange('happy')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  feedbackFilter === 'happy'
                    ? 'bg-emerald-500/30 border border-emerald-400 text-emerald-300'
                    : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'
                }`}
              >
                😊 Happy ({happyCount})
              </button>
              <button
                type="button"
                onClick={() => handleFilterChange('sad')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  feedbackFilter === 'sad'
                    ? 'bg-rose-500/30 border border-rose-400 text-rose-300'
                    : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'
                }`}
              >
                😞 Sad ({sadCount})
              </button>
            </div>

            {/* Feedback List */}
            <div className="space-y-3 pr-1">
              {paginatedFeedback.length ? (
                paginatedFeedback.map((item) => {
                  const sentiment = getFeedbackSentiment(item);
                  const sentimentEmoji = sentiment === 'excited' ? '🤩' : sentiment === 'happy' ? '😊' : '😞';
                  const sentimentColor =
                    sentiment === 'excited'
                      ? 'border-[#040e40]/30 bg-[#040e40]/15 text-blue-300'
                      : sentiment === 'happy'
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                      : 'border-rose-500/30 bg-rose-500/10 text-rose-300';

                  return (
                    <article key={item.id} className="rounded-xl border border-white/5 bg-black/30 p-4 space-y-2 hover:border-white/10 transition-colors">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${sentimentColor}`}>
                            <span>{sentimentEmoji}</span>
                            <span className="capitalize">{sentiment}</span>
                          </span>
                          <span className="text-xs font-mono text-gray-400 bg-white/5 px-2 py-0.5 rounded">
                            {item.rating}/5 ★
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => deleteFeedback(item.id)}
                          disabled={busy === `delete-fb-${item.id}`}
                          className="rounded-md p-1.5 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                          title="Delete feedback"
                          aria-label="Delete feedback"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <p className="text-sm text-gray-200 leading-relaxed font-medium">{item.message}</p>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/5 text-[11px] text-gray-400">
                        <span>
                          <strong className="text-white">{item.name || 'Anonymous Citizen'}</strong>
                          {item.area ? ` • 📍 ${item.area}` : ''}
                          {item.category ? ` • ${item.category}` : ''}
                        </span>
                        <span className="text-gray-500">{new Date(item.createdAt).toLocaleString()}</span>
                      </div>
                    </article>
                  );
                })
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">
                  No {feedbackFilter !== 'all' ? feedbackFilter : ''} feedback received yet.
                </p>
              )}
            </div>

            {/* Pagination Controls */}
            {totalFilteredCount > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-white/10 text-xs">
                <div className="flex items-center gap-3 text-gray-400">
                  <span>
                    Showing <strong className="text-white">{startIndex + 1}</strong>–<strong className="text-white">{endIndex}</strong> of <strong className="text-white">{totalFilteredCount}</strong>
                  </span>
                  <div className="flex items-center gap-1.5 border-l border-white/10 pl-3">
                    <span className="text-gray-500">Per page:</span>
                    {[6, 12, 24].map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => {
                          setFeedbackPageSize(size);
                          setFeedbackPage(1);
                        }}
                        className={`px-2 py-0.5 rounded text-xs font-semibold transition-colors ${
                          feedbackPageSize === size
                            ? 'bg-[#040e40] text-white font-bold'
                            : 'bg-white/5 hover:bg-white/10 text-gray-300'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center gap-1 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setFeedbackPage((p) => Math.max(1, p - 1))}
                      disabled={safePage <= 1}
                      className="p-1 rounded-lg border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      title="Previous page"
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>

                    <div className="flex items-center gap-1 px-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((p) => {
                          if (totalPages <= 5) return true;
                          if (p === 1 || p === totalPages) return true;
                          if (Math.abs(p - safePage) <= 1) return true;
                          return false;
                        })
                        .reduce<(number | string)[]>((acc, p, idx, arr) => {
                          if (idx > 0 && p - (arr[idx - 1] as number) > 1) {
                            acc.push(`dots-${p}`);
                          }
                          acc.push(p);
                          return acc;
                        }, [])
                        .map((pageItem) => {
                          if (typeof pageItem === 'string') {
                            return (
                              <span key={pageItem} className="px-1 text-gray-500">
                                …
                              </span>
                            );
                          }
                          return (
                            <button
                              key={pageItem}
                              type="button"
                              onClick={() => setFeedbackPage(pageItem)}
                              className={`h-7 w-7 rounded-lg text-xs font-bold transition-colors ${
                                safePage === pageItem
                                  ? 'bg-[#040e40] text-white font-black'
                                  : 'border border-white/5 bg-white/5 hover:bg-white/10 text-gray-300'
                              }`}
                            >
                              {pageItem}
                            </button>
                          );
                        })}
                    </div>

                    <button
                      type="button"
                      onClick={() => setFeedbackPage((p) => Math.min(totalPages, p + 1))}
                      disabled={safePage >= totalPages}
                      className="p-1 rounded-lg border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      title="Next page"
                      aria-label="Next page"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Audit Log */}
        <section className="rounded-lg border border-white/10 bg-white/[0.03] p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-bold">Admin activity log</h2>
              <p className="mt-1 text-xs text-gray-500">{data.logs.length} recent recorded actions</p>
            </div>
            <div className="flex items-center gap-2">
              {auditLogOpen && data.logs.length > 0 && (
                <button
                  onClick={clearAuditLog}
                  disabled={busy === 'clear-audit-log'}
                  className="rounded-lg border border-red-400/30 px-3 py-2 text-xs font-bold text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                >
                  {busy === 'clear-audit-log' ? 'Clearing...' : 'Clear log'}
                </button>
              )}
              <button
                onClick={() => setAuditLogOpen((open) => !open)}
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-gray-200 hover:bg-white/5"
              >
                {auditLogOpen ? (
                  <>
                    <ChevronUp className="h-4 w-4" /> Close
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" /> Expand
                  </>
                )}
              </button>
            </div>
          </div>
          {auditLogOpen && (
            <div className="mt-4 max-h-80 space-y-2 overflow-y-auto">
              {data.logs.length ? (
                data.logs.map((log) => (
                  <p key={log.id} className="text-sm text-gray-400">
                    <span className="text-white">{log.action.replaceAll('_', ' ')}</span>
                    {log.detail ? ` (${log.detail})` : ''}{' '}
                    <span className="text-gray-600">
                      by {log.adminEmail} · {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </p>
                ))
              ) : (
                <p className="text-sm text-gray-500">No admin activity has been recorded.</p>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
