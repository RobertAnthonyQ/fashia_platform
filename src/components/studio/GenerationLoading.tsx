import { Loader2, Sparkles } from "lucide-react";

export function GenerationLoading() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center space-y-6">
      <div className="relative">
        <div className="absolute inset-0 animate-ping rounded-full bg-[#BEFF00]/20" />
        <div className="relative rounded-full bg-zinc-900 p-6 border border-zinc-800">
          <Sparkles className="h-10 w-10 text-[#BEFF00] animate-pulse" />
        </div>
      </div>
      <div className="text-center space-y-2">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
          <p className="text-sm font-medium text-zinc-200">
            AI is generating your photo...
          </p>
        </div>
        <p className="text-xs text-zinc-500">This may take up to 30 seconds</p>
      </div>
    </div>
  );
}
