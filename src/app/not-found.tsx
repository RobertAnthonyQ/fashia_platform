import Link from "next/link";
import { Button } from "../../components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#09090B] px-4 text-center">
      <h1 className="text-7xl font-bold text-[#BEFF00] font-heading">404</h1>
      <p className="mt-4 text-lg text-zinc-300">Página no encontrada</p>
      <p className="mt-1 text-sm text-zinc-500">
        La página que buscas no existe o ha sido movida.
      </p>
      <Link href="/" className="mt-6">
        <Button className="bg-[#BEFF00] text-black hover:bg-[#BEFF00]/90 font-semibold rounded-lg">
          Ir al inicio
        </Button>
      </Link>
    </div>
  );
}
