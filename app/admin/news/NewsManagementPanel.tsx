/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  RefreshCw,
  Edit3,
  Trash2,
  Eye,
  Upload,
  Check,
  X,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  ImageIcon
} from 'lucide-react';
import type { NewsEventItem } from '@/lib/newsEvents';
import NewsEventDetailModal from '@/components/NewsEventDetailModal';

export default function NewsManagementPanel() {
  const [items, setItems] = useState<NewsEventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [previewItem, setPreviewItem] = useState<NewsEventItem | null>(null);

  // Form Modal State (for Create & Edit)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<NewsEventItem['category']>('News');
  const [formSummary, setFormSummary] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('/assets/slide1.png');
  const [formEventDate, setFormEventDate] = useState('');
  const [formEventLocation, setFormEventLocation] = useState('');
  const [formAuthor, setFormAuthor] = useState('EDSA Corporate Communications');
  const [formFeatured, setFormFeatured] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchItems = async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/news?all=true', { cache: 'no-store' });
      const data = await res.json();
      if (data && data.items) {
        setItems(data.items);
      }
    } catch {
      // keep existing
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setFormTitle('');
    setFormCategory('News');
    setFormSummary('');
    setFormContent('');
    setFormImageUrl('/assets/slide1.png');
    setFormEventDate('');
    setFormEventLocation('');
    setFormAuthor('EDSA Corporate Communications');
    setFormFeatured(false);
    setFormError(null);
    setFormSuccess(null);
    setIsFormOpen(true);
  };

  const openEditModal = (item: NewsEventItem) => {
    setEditingId(item.id);
    setFormTitle(item.title);
    setFormCategory(item.category);
    setFormSummary(item.summary);
    setFormContent(item.content);
    setFormImageUrl(item.imageUrl);
    setFormEventDate(item.eventDate || '');
    setFormEventLocation(item.eventLocation || '');
    setFormAuthor(item.author || 'EDSA Corporate Communications');
    setFormFeatured(Boolean(item.featured));
    setFormError(null);
    setFormSuccess(null);
    setIsFormOpen(true);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setFormError('Photo file must be under 5MB.');
      return;
    }

    try {
      setUploadingPhoto(true);
      setFormError(null);

      // Read as base64 data URL
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        try {
          const res = await fetch('/api/news/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dataUrl: base64Data, filename: file.name })
          });
          const result = await res.json();
          if (res.ok && result.url) {
            setFormImageUrl(result.url);
          } else {
            // Direct fallback
            setFormImageUrl(base64Data);
          }
        } catch {
          // Direct fallback to dataUrl
          setFormImageUrl(base64Data);
        } finally {
          setUploadingPhoto(false);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setFormError('Failed to read image file.');
      setUploadingPhoto(false);
    }
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError('Title is required.');
      return;
    }
    if (!formSummary.trim()) {
      setFormError('Summary is required.');
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      if (editingId) {
        // Update
        const res = await fetch('/api/news', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingId,
            title: formTitle.trim(),
            category: formCategory,
            summary: formSummary.trim(),
            content: formContent.trim() || formSummary.trim(),
            imageUrl: formImageUrl,
            eventDate: formEventDate.trim() || undefined,
            eventLocation: formEventLocation.trim() || undefined,
            author: formAuthor.trim() || 'EDSA Corporate Communications',
            featured: formFeatured
          })
        });
        const data = await res.json();
        if (res.ok) {
          setFormSuccess('Card updated successfully!');
          fetchItems();
          setTimeout(() => setIsFormOpen(false), 800);
        } else {
          setFormError(data.error || 'Failed to update card.');
        }
      } else {
        // Create
        const res = await fetch('/api/news', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: formTitle.trim(),
            category: formCategory,
            summary: formSummary.trim(),
            content: formContent.trim() || formSummary.trim(),
            imageUrl: formImageUrl,
            eventDate: formEventDate.trim() || undefined,
            eventLocation: formEventLocation.trim() || undefined,
            author: formAuthor.trim() || 'EDSA Corporate Communications',
            featured: formFeatured
          })
        });
        const data = await res.json();
        if (res.ok) {
          setFormSuccess('New card created and published!');
          fetchItems();
          setTimeout(() => setIsFormOpen(false), 800);
        } else {
          setFormError(data.error || 'Failed to create card.');
        }
      }
    } catch {
      setFormError('Network error while saving.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEnable = async (item: NewsEventItem) => {
    const nextState = !item.enabled;
    try {
      // Optimistic update
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, enabled: nextState } : i))
      );

      await fetch('/api/news', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, enabled: nextState })
      });
    } catch {
      fetchItems();
    }
  };

  const handleDeleteCard = async (item: NewsEventItem) => {
    const confirmed = window.confirm(`Permanently delete "${item.title}"? This cannot be undone.`);
    if (!confirmed) return;

    try {
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      await fetch(`/api/news?id=${encodeURIComponent(item.id)}`, {
        method: 'DELETE'
      });
    } catch {
      fetchItems();
    }
  };

  const activeCount = items.filter((i) => i.enabled).length;
  const disabledCount = items.filter((i) => !i.enabled).length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/admin/operations"
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition-colors font-semibold"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Operations</span>
            </Link>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>EDSA News &amp; Events Admin</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold border border-blue-200">
              Live Slider Control
            </span>
          </h1>
          <p className="text-xs text-slate-500">
            Publish, edit, disable, or delete cards displayed in the homepage news and events slider.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchItems}
            disabled={refreshing}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs"
            title="Refresh news cards"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md shadow-blue-500/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Create News / Event</span>
          </button>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Cards</span>
          <p className="text-2xl font-black text-slate-900">{items.length}</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-emerald-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live on Homepage
          </span>
          <p className="text-2xl font-black text-emerald-900">{activeCount}</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Disabled / Hidden</span>
          <p className="text-2xl font-black text-slate-600">{disabledCount}</p>
        </div>
      </div>

      {/* Cards List */}
      <div className="space-y-4">
        <h2 className="text-sm font-black uppercase tracking-wider text-slate-700">
          Managed Cards ({items.length})
        </h2>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 bg-white rounded-3xl border border-slate-200 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
            <span>Loading news &amp; event cards...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 bg-white rounded-3xl border border-dashed border-slate-300 space-y-3">
            <ImageIcon className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-bold text-slate-700 text-sm">No cards yet</p>
            <p className="max-w-xs mx-auto text-slate-500">
              Create your first news or event card to display updates to citizens on the homepage.
            </p>
            <button
              type="button"
              onClick={openCreateModal}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs uppercase"
            >
              Add Card
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-3xl border transition-all bg-white shadow-sm flex flex-col justify-between space-y-3 ${
                  item.enabled ? 'border-slate-200 hover:border-slate-300' : 'border-slate-200 bg-slate-50/70 opacity-75'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Thumbnail Image */}
                  <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                    <img
                      src={item.imageUrl || '/assets/slide1.png'}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    {!item.enabled && (
                      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center text-[10px] font-black uppercase tracking-wider text-white">
                        Disabled
                      </div>
                    )}
                  </div>

                  {/* Text Meta */}
                  <div className="flex-1 space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/60 uppercase">
                        {item.category}
                      </span>
                      {item.featured && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 flex items-center gap-0.5">
                          <Sparkles className="w-2.5 h-2.5" />
                          Featured
                        </span>
                      )}
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        item.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {item.enabled ? 'Live' : 'Hidden'}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 line-clamp-1">{item.title}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{item.summary}</p>

                    {(item.eventDate || item.eventLocation) && (
                      <div className="text-[10px] text-purple-700 font-medium flex items-center gap-2 pt-0.5">
                        {item.eventDate && <span>📅 {item.eventDate}</span>}
                        {item.eventLocation && <span className="line-clamp-1">📍 {item.eventLocation}</span>}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Action Controls */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  {/* Enable / Disable Toggle */}
                  <button
                    type="button"
                    onClick={() => handleToggleEnable(item)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      item.enabled
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                    }`}
                    title={item.enabled ? 'Click to disable' : 'Click to enable'}
                  >
                    {item.enabled ? (
                      <>
                        <ToggleRight className="w-4 h-4 text-emerald-600" />
                        <span>Enabled</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-4 h-4 text-slate-400" />
                        <span>Disabled</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-1.5">
                    {/* Preview Pop-up */}
                    <button
                      type="button"
                      onClick={() => setPreviewItem(item)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 border border-slate-200 text-xs font-bold transition-all"
                      title="Preview pop-up modal"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {/* Edit */}
                    <button
                      type="button"
                      onClick={() => openEditModal(item)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold transition-all"
                      title="Edit card details"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => handleDeleteCard(item)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 border border-slate-200 text-xs font-bold transition-all"
                      title="Delete card"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl sm:rounded-[2rem] border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  {editingId ? 'Edit News / Event Card' : 'Create New News / Event Card'}
                </h2>
                <p className="text-xs text-slate-500">
                  Fill in the story details and upload a photo for the homepage slider.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
                {formError}
              </div>
            )}
            {formSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveForm} className="space-y-4">
              {/* Category & Featured */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as NewsEventItem['category'])}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-500"
                  >
                    <option value="News">News</option>
                    <option value="Event">Event</option>
                    <option value="Press Release">Press Release</option>
                    <option value="Maintenance">Maintenance Alert</option>
                    <option value="Community">Community Notice</option>
                  </select>
                </div>

                <div className="flex items-center gap-3 pt-6">
                  <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={formFeatured}
                      onChange={(e) => setFormFeatured(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>Pin as Featured (front of slider)</span>
                  </label>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Headline / Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kassiri & Kambia 33kV Substation Commissioning"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Photo Upload Section */}
              <div className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <label className="block text-xs font-bold text-slate-900">Card Photo / Image</label>
                
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Photo Preview Thumbnail */}
                  <div className="relative w-28 h-20 rounded-xl overflow-hidden bg-white border border-slate-200 shrink-0 shadow-2xs">
                    <img
                      src={formImageUrl || '/assets/slide1.png'}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Upload Controls */}
                  <div className="space-y-2 flex-1 w-full">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingPhoto}
                        className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-2xs active:scale-95 transition-all"
                      >
                        <Upload className="w-3.5 h-3.5 text-blue-600" />
                        <span>{uploadingPhoto ? 'Uploading...' : 'Upload Photo from Device'}</span>
                      </button>

                      {/* Template Asset Quick Picker */}
                      {(['/assets/slide1.png', '/assets/slide2.png', '/assets/slide3.png', '/assets/hero-bg.png'] as const).map((asset, i) => (
                        <button
                          key={asset}
                          type="button"
                          onClick={() => setFormImageUrl(asset)}
                          className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all ${
                            formImageUrl === asset
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          Preset {i + 1}
                        </button>
                      ))}
                    </div>

                    <input
                      type="url"
                      placeholder="Or paste direct image URL (https://...)"
                      value={formImageUrl}
                      onChange={(e) => setFormImageUrl(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-[11px] text-slate-700 font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Event Specific Date & Location (shown if category is Event) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Event Date / Schedule <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Saturday, Nov 7, 2026 at 10:00 AM"
                    value={formEventDate}
                    onChange={(e) => setFormEventDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Event Location / Venue <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. City Hall Auditorium, Freetown"
                    value={formEventLocation}
                    onChange={(e) => setFormEventLocation(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Summary (card snippet) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Short Summary (Card Preview) *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="2-sentence teaser displayed directly on the sliding card..."
                  value={formSummary}
                  onChange={(e) => setFormSummary(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              {/* Full Article Content */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Article Content (Shown in Pop-Up Modal) *
                </label>
                <textarea
                  rows={6}
                  required
                  placeholder="Complete article or event details. Separate paragraphs with double enter for clean formatting..."
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Author */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Author / Authority Byline</label>
                <input
                  type="text"
                  placeholder="e.g. EDSA Corporate Communications"
                  value={formAuthor}
                  onChange={(e) => setFormAuthor(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Footer Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider transition-all disabled:opacity-60 shadow-md shadow-blue-500/20 active:scale-95"
                >
                  {saving ? 'Saving...' : editingId ? 'Update Card' : 'Publish Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pop-up Modal Preview */}
      <NewsEventDetailModal
        item={previewItem}
        onClose={() => setPreviewItem(null)}
      />
    </div>
  );
}
