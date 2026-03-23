"use client";

import { Button } from "../../../components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="rounded-full bg-red-900/20 p-3 mb-4">
        <AlertTriangle className="h-8 w-8 text-red-400" />
      </div>
      <h2 className="text-lg font-semibold text-zinc-200">
        Algo salió mal
      </h2>
      <p className="mt-1 text-sm text-zinc-400 max-w-md">
        Se ha producido un error inesperado. Por favor, inténtelo de nuevo.
      </p>
      <Button
        onClick={reset}
        className="mt-4 bg-[#BEFF00] text-black hover:bg-[#BEFF00]/90 font-semibold rounded-lg"
      >
        Intentar otra vez
      </Button>
    </div>
  );
}
