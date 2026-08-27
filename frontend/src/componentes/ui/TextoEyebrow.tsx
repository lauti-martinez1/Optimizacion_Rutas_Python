import type { ReactNode } from "react";

import { combinarClases } from "./combinarClases";

export function TextoEyebrow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={combinarClases(
        "mt-3.5 mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-texto-tenue",
        className,
      )}
    >
      {children}
    </p>
  );
}
