"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import api from "@/lib/axios";
import { RefreshCw, Plus, Save, Trash2, CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";

type Channel = {
  id: number;
  name: string;
  channel_id: string;
  is_active?: boolean | number;
  subscriber_count?: number | null;
  video_count?: number | null;
  last_video_date?: string | null;
  updated_at?: string;
};

type ChannelForm = {
  name: string;
  channel_id: string;
  is_active: boolean;
};

const INITIAL_FORM: ChannelForm = {
  name: "",
  channel_id: "",
  is_active: true,
};

function toChannels(payload: any): Channel[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.channels)) return payload.channels;
  return [];
}

function formatNumber(value?: number | null): string {
  if (value == null) return "-";
  return new Intl.NumberFormat("en-US").format(value);
}

function formatDate(value?: string | null): string {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString("en-GB");
}

export default function YoutubeChannelManagementPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [form, setForm] = useState<ChannelForm>(INITIAL_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncingId, setSyncingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadChannels = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await api.get("/api/admin/youtube-channels");
      setChannels(toChannels(res?.data));
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to load YouTube channels.";
      setError(msg);
      setChannels([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChannels();
  }, [loadChannels]);

  const activeCount = useMemo(
    () => channels.filter((c) => Boolean(Number(c.is_active ?? 0))).length,
    [channels]
  );

  const resetForm = () => {
    setForm(INITIAL_FORM);
    setEditingId(null);
  };

  const startEdit = (channel: Channel) => {
    setEditingId(channel.id);
    setForm({
      name: channel.name || "",
      channel_id: channel.channel_id || "",
      is_active: Boolean(Number(channel.is_active ?? 0)),
    });
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();

    const name = form.name.trim();
    const channelId = form.channel_id.trim();

    if (!name || !channelId) {
      toast.error("Name and Channel ID are required.");
      return;
    }

    if (!channelId.startsWith("UC") || channelId.length !== 24) {
      toast.error("Channel ID must start with UC and contain 24 characters.");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name,
        channel_id: channelId,
        is_active: form.is_active,
      };

      if (editingId != null) {
        await api.put(`/api/admin/youtube-channels/${editingId}`, payload);
        toast.success("Channel updated.");
      } else {
        await api.post("/api/admin/youtube-channels", payload);
        toast.success("Channel added.");
      }

      resetForm();
      await loadChannels();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to save channel.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const syncChannel = async (id: number) => {
    try {
      setSyncingId(id);
      await api.post(`/api/admin/youtube-channels/${id}/sync`);
      toast.success("Channel synced from YouTube API.");
      await loadChannels();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to sync channel.";
      toast.error(msg);
    } finally {
      setSyncingId(null);
    }
  };

  const deleteChannel = async (id: number) => {
    if (!confirm("Delete this channel?")) return;

    try {
      setDeletingId(id);
      await api.delete(`/api/admin/youtube-channels/${id}`);
      toast.success("Channel deleted.");

      if (editingId === id) resetForm();
      await loadChannels();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to delete channel.";
      toast.error(msg);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="rounded-2xl border border-border bg-card p-5 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">YouTube Channels</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Connected with backend API. No simulation mode.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-lg border border-border px-3 py-1 text-sm text-foreground">
              Total: {channels.length}
            </span>
            <span className="rounded-lg border border-border px-3 py-1 text-sm text-foreground">
              Active: {activeCount}
            </span>
            <button
              type="button"
              onClick={loadChannels}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-foreground hover:bg-accent"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 md:p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          {editingId != null ? "Edit Channel" : "Add Channel"}
        </h2>

        <form onSubmit={submit} className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-foreground outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="Main channel"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Channel ID</label>
            <input
              value={form.channel_id}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, channel_id: e.target.value.trim() }))
              }
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-foreground outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="UCxxxxxxxxxxxxxxxxxxxxxx"
            />
          </div>

          <div className="flex items-end justify-between gap-3">
            <label className="inline-flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, is_active: e.target.checked }))
                }
                className="h-4 w-4 rounded border-border"
              />
              Active
            </label>

            <div className="flex items-center gap-2">
              {editingId != null && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-foreground hover:bg-accent"
                >
                  <RotateCcw className="h-4 w-4" />
                  Cancel
                </button>
              )}

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
              >
                {editingId != null ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {saving ? "Saving..." : editingId != null ? "Update" : "Add"}
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 md:p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Channels List</h2>

        {error && (
          <div className="mb-4 rounded-lg border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-500">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-10 text-center text-sm text-muted-foreground">Loading...</div>
        ) : channels.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">No channels found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2">
              <thead>
                <tr className="text-left text-xs uppercase text-muted-foreground">
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Channel ID</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Subscribers</th>
                  <th className="px-3 py-2">Videos</th>
                  <th className="px-3 py-2">Last Video</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>

              <tbody>
                {channels.map((channel) => {
                  const isActive = Boolean(Number(channel.is_active ?? 0));
                  const isSyncing = syncingId === channel.id;
                  const isDeleting = deletingId === channel.id;

                  return (
                    <tr key={channel.id} className="rounded-xl border border-border bg-background/60">
                      <td className="px-3 py-3 text-sm text-foreground">{channel.name}</td>
                      <td className="px-3 py-3 font-mono text-xs text-foreground/80">{channel.channel_id}</td>
                      <td className="px-3 py-3 text-sm">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ${
                            isActive
                              ? "bg-emerald-500/15 text-emerald-500"
                              : "bg-rose-500/15 text-rose-500"
                          }`}
                        >
                          {isActive ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                          {isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-sm text-foreground">{formatNumber(channel.subscriber_count)}</td>
                      <td className="px-3 py-3 text-sm text-foreground">{formatNumber(channel.video_count)}</td>
                      <td className="px-3 py-3 text-sm text-foreground">{formatDate(channel.last_video_date)}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(channel)}
                            className="rounded-md border border-border px-2.5 py-1.5 text-xs text-foreground hover:bg-accent"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => syncChannel(channel.id)}
                            className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs text-foreground hover:bg-accent"
                            disabled={isSyncing}
                          >
                            <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                            {isSyncing ? "Syncing" : "Sync"}
                          </button>

                          <button
                            type="button"
                            onClick={() => deleteChannel(channel.id)}
                            className="inline-flex items-center gap-1 rounded-md border border-red-400/40 px-2.5 py-1.5 text-xs text-red-500 hover:bg-red-500/10"
                            disabled={isDeleting}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            {isDeleting ? "Deleting" : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
