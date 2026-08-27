import type { HTMLAttributes, ReactNode } from "react";

import { combinarClases } from "./combinarClases";

export function TarjetaContenido({
  className,
  children,
  ...resto
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={combinarClases(
        "rounded-xl bg-blanco px-5 py-6 text-[13.5px] text-texto-mutado shadow-md",
        className,
      )}
      {...resto}
    >
      {children}
    </div>
  );
}

export function CabeceraTarjeta({ children }: { children: ReactNode }) {
  return <div className="flex items-center justify-between gap-3">{children}</div>;
}

export function TituloTarjeta({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <p className={combinarClases("mb-1.5 text-sm font-bold text-texto-fuerte", className)}>
      {children}
    </p>
  );
}
