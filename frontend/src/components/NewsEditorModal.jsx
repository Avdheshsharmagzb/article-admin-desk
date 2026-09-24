import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { STATUS_CONFIG, NEXT_ACTION } from "@/lib/statusConfig";
import {
  ExternalLink,
  Save,
  ArrowRight,
  Video,
  Image as ImageIcon,
  FileText,
  Sparkles,
} from "lucide-react";

const wordCount = (t) => (t || "").trim().split(/\s+/).filter(Boolean).length;

export const NewsEditorModal = ({ item, open, onClose, onSave, onAdvance }) => {
  const [rewrittenTitle, setRewrittenTitle] = useState("");
  const [rewrittenContent, setRewrittenContent] = useState("");

  useEffect(() => {
    if (item) {
      setRewrittenTitle(item.rewritten_title || "");
      setRewrittenContent(item.rewritten_content || "");
    }
  }, [item]);

  if (!item) return null;

  const cfg = STATUS_CONFIG[item.status];
  const StatusIcon = cfg.icon;
  const next = NEXT_ACTION[item.status];
  const readOnly = item.status === "Published";
  const dirty =
    rewrittenTitle !== (item.rewritten_title || "") ||
    rewrittenContent !== (item.rewritten_content || "");

  const handleSave = () =>
    onSave(item.id, {
      rewritten_title: rewrittenTitle,
      rewritten_content: rewrittenContent,
    });

  const handleAdvance = () => {
    if (next?.requiresRewrite && (!rewrittenTitle.trim() || !rewrittenContent.trim())) {
      return;
    }
    onAdvance(item, {
      rewritten_title: rewrittenTitle,
      rewritten_content: rewrittenContent,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        data-testid="side-by-side-modal"
        className="max-w-6xl w-[95vw] max-h-[92vh] overflow-hidden flex flex-col bg-slate-950 border-slate-800 p-0 gap-0"
      >
        <DialogHeader className="border-b border-slate-800 px-6 py-4 space-y-0">
          <div className="flex items-center justify-between gap-4 pr-8">
            <DialogTitle className="font-serif-display text-xl text-slate-100 flex items-center gap-3">
              Editorial Workspace
            </DialogTitle>
            <Badge className={`gap-1.5 ${cfg.badge}`}>
              <StatusIcon className="h-3 w-3" />
              {cfg.label}
            </Badge>
          </div>
          <DialogDescription className="sr-only">
            Compare the original feed with the rewritten draft and advance the item through the editorial workflow.
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 px-6 py-5">
          {/* Media */}
          {item.media_url && (
            <div className="mb-6 rounded-xl overflow-hidden border border-slate-800 bg-slate-900">
              <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-800 text-[11px] font-mono uppercase tracking-wider text-slate-500">
                {item.media_type === "video" ? (
                  <Video className="h-3.5 w-3.5" />
                ) : (
                  <ImageIcon className="h-3.5 w-3.5" />
                )}
                {item.media_type} media
              </div>
              {item.media_type === "video" ? (
                <video
                  src={item.media_url}
                  controls
                  className="w-full max-h-[340px] bg-black"
                />
              ) : (
                <img
                  src={item.media_url}
                  alt={item.original_title}
                  className="w-full max-h-[340px] object-cover"
                />
              )}
            </div>
          )}

          <a
            href={item.original_url}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="modal-source-link"
            className="inline-flex items-center gap-1.5 mb-5 text-xs font-mono text-slate-500 hover:text-slate-300 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {item.original_url}
          </a>

          {/* Side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Original */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-slate-500">
                <FileText className="h-3.5 w-3.5" />
                Original Feed
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-slate-500">Title</label>
                <div className="rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-3 font-serif-display text-base text-slate-200 leading-snug">
                  {item.original_title}
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-slate-500">Content</label>
                  <span className="text-[10px] font-mono text-slate-600">
                    {wordCount(item.original_content)} words
                  </span>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-3 text-sm text-slate-400 leading-relaxed whitespace-pre-wrap min-h-[200px]">
                  {item.original_content}
                </div>
              </div>
            </div>

            {/* Rewritten */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-purple-400">
                <Sparkles className="h-3.5 w-3.5" />
                Rewritten Draft
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-slate-500">Title</label>
                <Input
                  data-testid="rewritten-title-input"
                  value={rewrittenTitle}
                  onChange={(e) => setRewrittenTitle(e.target.value)}
                  readOnly={readOnly}
                  placeholder="Write the polished headline…"
                  className="font-serif-display text-base bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-600 focus-visible:ring-purple-500/40"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-slate-500">Content</label>
                  <span className="text-[10px] font-mono text-slate-600">
                    {wordCount(rewrittenContent)} words
                  </span>
                </div>
                <Textarea
                  data-testid="rewritten-content-input"
                  value={rewrittenContent}
                  onChange={(e) => setRewrittenContent(e.target.value)}
                  readOnly={readOnly}
                  placeholder="Write the rewritten article body…"
                  className="min-h-[200px] text-sm bg-slate-900 border-slate-700 text-slate-200 leading-relaxed placeholder:text-slate-600 focus-visible:ring-purple-500/40"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-800 px-6 py-4">
          <Button
            variant="ghost"
            onClick={onClose}
            data-testid="modal-close-btn"
            className="text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            Close
          </Button>
          <div className="flex items-center gap-2">
            {!readOnly && (
              <Button
                data-testid="modal-save-btn"
                variant="outline"
                onClick={handleSave}
                disabled={!dirty}
                className="border-slate-700 bg-slate-800/50 text-slate-200 hover:bg-slate-800 hover:text-white disabled:opacity-40"
              >
                <Save className="h-4 w-4 mr-1.5" />
                Save Draft
              </Button>
            )}
            {next && (
              <Button
                data-testid="modal-advance-btn"
                onClick={handleAdvance}
                disabled={
                  next.requiresRewrite &&
                  (!rewrittenTitle.trim() || !rewrittenContent.trim())
                }
                className={`${next.className} disabled:opacity-40`}
              >
                {next.label}
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
