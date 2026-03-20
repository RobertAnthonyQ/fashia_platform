"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Heart, Download, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Database } from "@/src/types/database";

type GeneratedOutput = Database["public"]["Tables"]["generated_outputs"]["Row"];

interface ImageDetailModalProps {
  output: GeneratedOutput | null;
  onClose: () => void;
  onFavorite: (id: string, current: boolean) => void;
}

export function ImageDetailModal({
  output,
  onClose,
  onFavorite,
}: ImageDetailModalProps) {
  if (!output) return null;

  return (
    <Dialog open={!!output} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl bg-zinc-900 border-zinc-800 p-0 overflow-hidden">
        <div className="relative">
          {output.image_url && (
            <img
              src={output.image_url}
              alt={output.angle ?? "Fashion photo"}
              className="w-full max-h-[80vh] object-contain"
            />
          )}

          {/* Top bar */}
          <div className="absolute left-0 right-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent p-4">
            {output.angle && (
              <span className="rounded-md bg-black/60 px-2 py-1 text-sm text-white">
                {output.angle}
              </span>
            )}
            <div className="ml-auto flex items-center gap-2">
              <Button
                size="icon"
                variant="ghost"
                className="h-9 w-9 bg-black/50 hover:bg-black/70 text-white"
                onClick={() =>
                  onFavorite(output.id, output.is_favorite ?? false)
                }
              >
                <Heart
                  className={cn(
                    "h-4 w-4",
                    output.is_favorite
                      ? "fill-red-500 text-red-500"
                      : "text-white",
                  )}
                />
              </Button>
              {output.image_url && (
                <a
                  href={output.image_url}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9 bg-black/50 hover:bg-black/70 text-white"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </a>
              )}
            </div>
          </div>

          {/* Info bar */}
          <div className="border-t border-zinc-800 p-4">
            <div className="flex items-center gap-4 text-sm text-zinc-400">
              <span>
                Created:{" "}
                {output.created_at
                  ? new Date(output.created_at).toLocaleDateString()
                  : "Unknown"}
              </span>
              {output.media_type && <span>Type: {output.media_type}</span>}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
