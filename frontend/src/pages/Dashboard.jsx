import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { newsApi } from "@/lib/api";
import {
  STATUS_ORDER,
  STATUS_CONFIG,
  ALL_TAB,
  NEXT_ACTION,
} from "@/lib/statusConfig";
import { NewsCard } from "@/components/NewsCard";
import { NewsEditorModal } from "@/components/NewsEditorModal";
import { Newspaper, Inbox, RefreshCw } from "lucide-react";

const TABS = [ALL_TAB, ...STATUS_ORDER.map((s) => STATUS_CONFIG[s])];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("all");
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({ total: 0 });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      setStats(await newsApi.stats());
    } catch (e) {
      console.error(e);
    }
  }, []);

  const loadItems = useCallback(async (tab) => {
    setLoading(true);
    try {
      const data = await newsApi.list(tab === "all" ? null : tab);
      setItems(data);
    } catch (e) {
      toast.error("Failed to load news items");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems(activeTab);
  }, [activeTab, loadItems]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const refresh = () => {
    loadItems(activeTab);
    loadStats();
  };

  const openItem = (item) => {
    setSelected(item);
    setModalOpen(true);
  };

  const handleSave = async (id, payload) => {
    try {
      const updated = await newsApi.update(id, payload);
      setSelected(updated);
      setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
      toast.success("Draft saved");
    } catch (e) {
      toast.error("Could not save draft");
    }
  };

  const advance = async (item, draft) => {
    const action = NEXT_ACTION[item.status];
    if (!action) return;
    try {
      if (draft && (draft.rewritten_title || draft.rewritten_content)) {
        await newsApi.update(item.id, draft);
      }
      await newsApi.setStatus(item.id, action.to);
      toast.success(`Moved to "${STATUS_CONFIG[action.to].label}"`);
      setModalOpen(false);
      setSelected(null);
      refresh();
    } catch (e) {
      toast.error("Could not update status");
    }
  };

  const advanceFromCard = (item) => {
    const action = NEXT_ACTION[item.status];
    if (action?.requiresRewrite && (!item.rewritten_title || !item.rewritten_content)) {
      toast.warning("Add a rewritten title & content first", {
        description: "Open the item to write the rewrite before submitting.",
      });
      openItem(item);
      return;
    }
    advance(item);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur sticky top-0 z-30">
        <div className="mx-auto max-w-7xl px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-900">
              <Newspaper className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-serif-display text-xl font-bold tracking-tight leading-none">
                Newsroom Admin
              </h1>
              <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500 mt-1">
                Editorial Pipeline · Command Center
              </p>
            </div>
          </div>
          <button
            data-testid="refresh-btn"
            onClick={refresh}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-300 hover:border-slate-700 hover:text-white transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {STATUS_ORDER.map((s) => {
            const cfg = STATUS_CONFIG[s];
            const Icon = cfg.icon;
            const active = activeTab === s;
            return (
              <button
                key={s}
                data-testid={`stat-card-${s}`}
                onClick={() => setActiveTab(s)}
                className={`text-left p-5 rounded-xl bg-slate-900/80 border transition-[border-color,transform] duration-200 hover:-translate-y-0.5 ${
                  active
                    ? "border-slate-500"
                    : "border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${cfg.badge}`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="font-serif-display text-3xl font-bold text-slate-100">
                    {stats[s] ?? 0}
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-400">{cfg.label}</p>
              </button>
            );
          })}
        </div>

        {/* Tabs */}
        <div
          data-testid="status-tabs"
          className="flex items-center gap-2 overflow-x-auto pb-3 border-b border-slate-800 mb-8"
        >
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            const count =
              tab.key === "all" ? stats.total ?? 0 : stats[tab.key] ?? 0;
            return (
              <button
                key={tab.key}
                data-testid={`tab-${tab.key}`}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                <span
                  className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-mono ${
                    active ? "bg-slate-900/10 text-slate-700" : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-80 rounded-xl bg-slate-900/60 border border-slate-800 animate-pulse"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div
            data-testid="empty-state"
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <Inbox className="h-12 w-12 text-slate-700 mb-4" />
            <h3 className="font-serif-display text-lg text-slate-300">
              No items in this stage
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Items will appear here as they move through the pipeline.
            </p>
          </div>
        ) : (
          <div
            data-testid="news-grid"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {items.map((item, i) => (
              <NewsCard
                key={item.id}
                item={item}
                index={i}
                onOpen={openItem}
                onAdvance={advanceFromCard}
              />
            ))}
          </div>
        )}
      </main>

      <NewsEditorModal
        item={selected}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        onAdvance={advance}
      />
    </div>
  );
}
