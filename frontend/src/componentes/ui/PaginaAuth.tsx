import type { ReactNode } from "react";

import { OverlayRuta } from "./OverlayRuta";

interface Props {
  /** Slot antes del título — Registro.tsx lo usa para el link "‹ Elegir otro
   * tipo de cuenta" cuando ya hay un tipo de cuenta elegido. */
  antes?: ReactNode;
  titulo: string;
  subtitulo: string;
  /** Enlace/texto al pie, ej. "¿No tenés cuenta? <Link>Registrate</Link>". */
  pie: ReactNode;
  children: ReactNode;
}

export function PaginaAuth({ antes, titulo, subtitulo, pie, children }: Props) {
  return (
    <div
      className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden
        bg-fondo bg-cover bg-center px-5 py-8
        [background-image:linear-gradient(180deg,rgba(16,24,40,.32)_0%,rgba(16,24,40,.08)_32%,rgba(16,24,40,.1)_62%,rgba(16,24,40,.55)_100%),linear-gradient(135deg,rgba(124,58,237,.28)_0%,rgba(124,58,237,0)_55%),url('/img/fondo-auth.jpg')]"
    >
      <OverlayRuta />
      <div className="relative z-10 flex w-full animate-aparecer-tarjeta flex-col items-center motion-reduce:animate-none">
        <div className="w-full max-w-[400px] rounded-xl border border-white/50 bg-[rgba(245,246,248,0.86)] px-7 py-8 shadow-[0_24px_48px_-12px_rgba(16,24,40,0.35)] backdrop-blur-[20px] backdrop-saturate-[1.4]">
          {antes}
          <h1 className="mb-1 text-xl font-bold text-texto-fuerte">{titulo}</h1>
          <p className="mb-6 text-[13px] text-texto-mutado">{subtitulo}</p>
          {children}
        </div>
        <p className="mt-5 rounded-pill bg-[rgba(16,24,40,0.34)] px-4 py-2 text-center text-[12.5px] text-blanco backdrop-blur-[8px]">
          {pie}
        </p>
      </div>
    </div>
  );
}
