/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Send,
  Loader2,
  CheckCircle2,
  Clock,
  MapPin,
  ShieldCheck,
  Users,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Plus
} from 'lucide-react';
import type { BulletinItem } from '@/app/api/bulletin/route';

interface AreaCommunityBulletinProps {
  areaName?: string;
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function AreaCommunityBulletin({ areaName = 'Freetown' }: AreaCommunityBulletinProps) {
  const [bulletins, setBulletins] = useState<BulletinItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [showPostForm, setShowPostForm] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // Form state
  const [postTitle, setPostTitle] = useState<string>('');
  const [postMessage, setPostMessage] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitFeedback, setSubmitFeedback] = useState<string | null>(null);

  const fetchBulletins = useCallback(async () => {
    try {
      const res = await fetch(`/api/bulletin?area=${encodeURIComponent(areaName)}`, {
        cache: 'no-store'
      });
      if (res.ok) {
        const data = await res.json();
        if (data.bulletins) {
          setBulletins(data.bulletins);
        }
      }
    } catch {
      // Keep existing data on network fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [areaName]);

  useEffect(() => {
    fetchBulletins();
  }, [fetchBulletins]);

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postMessage.trim()) return;

    setSubmitting(true);
    setSubmitFeedback(null);

    try {
      const res = await fetch('/api/bulletin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: postTitle.trim() || 'Community Grid Note',
          message: postMessage.trim(),
          area: areaName,
          author: 'Resident'
        })
      });

      if (res.ok) {
        setPostMessage('');
        setPostTitle('');
        setShowPostForm(false);
        setSubmitFeedback('Note shared with your neighborhood!');
        fetchBulletins();
        setTimeout(() => setSubmitFeedback(null), 4000);
      } else {
        setSubmitFeedback('Unable to submit right now.');
      }
    } catch {
      setSubmitFeedback('Network error.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-base">
                Community Grid Bulletin
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                {areaName}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Live field observations & neighborhood updates
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setRefreshing(true);
              fetchBulletins();
            }}
            disabled={refreshing}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title="Refresh community bulletin"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {submitFeedback && (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{submitFeedback}</span>
        </div>
      )}

      {isExpanded && (
        <div className="space-y-3.5 pt-1">
          {/* Post prompt button */}
          {!showPostForm ? (
            <button
              onClick={() => setShowPostForm(true)}
              className="w-full py-2.5 px-4 rounded-2xl border border-dashed border-indigo-300 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-700 text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Post neighborhood update (e.g. &ldquo;Crews working on pole&rdquo;, &ldquo;Phase 1 back&rdquo;)
            </button>
          ) : (
            <form
              onSubmit={handlePostSubmit}
              className="p-4 rounded-2xl border border-indigo-200 bg-indigo-50/40 space-y-3"
            >
              <div className="flex items-center justify-between text-xs font-bold text-indigo-950">
                <span>Post update for {areaName}</span>
                <button
                  type="button"
                  onClick={() => setShowPostForm(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  Cancel
                </button>
              </div>

              <input
                type="text"
                placeholder="Topic / Headline (e.g. Transformer repair near junction)"
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />

              <textarea
                rows={2}
                placeholder="What is happening? (e.g. Generator running, EDSA bucket truck just arrived, wire down...)"
                value={postMessage}
                onChange={(e) => setPostMessage(e.target.value)}
                required
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 resize-none"
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPostForm(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !postMessage.trim()}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 transition-colors shadow-xs"
                >
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Share Update
                </button>
              </div>
            </form>
          )}

          {/* Bulletin Feed List */}
          {loading ? (
            <div className="p-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              Loading neighborhood notes...
            </div>
          ) : bulletins.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
              No bulletin notes yet for {areaName}. Be the first neighbor to post!
            </div>
          ) : (
            <div className="space-y-2.5">
              {bulletins.map((item) => {
                const isOfficial = item.type === 'official' || item.type === 'maintenance';
                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      isOfficial
                        ? 'border-blue-200 bg-blue-50/50'
                        : 'border-slate-200 bg-slate-50/70'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {isOfficial ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-600 text-white">
                            <ShieldCheck className="w-3 h-3" /> Official Notice
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200 text-slate-700">
                            <Users className="w-3 h-3" /> Neighbor Note
                          </span>
                        )}
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {item.area || 'Freetown'}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {timeAgo(item.timestamp)}
                      </span>
                    </div>

                    <h4 className="font-bold text-xs text-slate-900 mt-2">
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      {item.message}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
