import type { ButtonHTMLAttributes } from "react";

import { combinarClases } from "./combinarClases";

type Variante = "primario" | "secundario" | "exito" | "peligro";
/** normal: ancho completo, la acción principal de una pantalla.
 * chica: compacta, para una acción puntual en una fila de lista.
 * auto: mismo alto/tipografía que normal pero sin estirarse — para un CTA
 * suelto que no debería ocupar todo el ancho (ej. estado vacío). */
type Tamanio = "normal" | "chica" | "auto";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  tamanio?: Tamanio;
  cargando?: boolean;
}

const BASE =
  "rounded-lg font-bold cursor-pointer flex items-center justify-center gap-2 " +
  "[touch-action:manipulation] transition-[transform,opacity,box-shadow,filter] duration-150 " +
  "active:scale-[0.97] disabled:opacity-55 disabled:cursor-not-allowed disabled:pointer-events-none " +
  "focus-visible:outline-offset-[3px]";

const TAMANIO: Record<Tamanio, string> = {
  normal: "w-full h-[50px] text-[13.5px]",
  chica: "w-auto h-9 px-4 text-[12.5px] shrink-0",
  auto: "w-auto h-[50px] px-7 text-[13.5px]",
};

const VARIANTES: Record<Variante, string> = {
  primario:
    "bg-primario text-blanco shadow-boton-primario hover:brightness-[1.06] " +
    "hover:shadow-[0_6px_16px_rgba(124,58,237,0.32)]",
  secundario: "bg-blanco text-texto-fuerte border border-borde hover:bg-fondo",
  exito:
    "bg-exito text-blanco shadow-boton-exito hover:brightness-[1.06] " +
    "hover:shadow-[0_6px_16px_rgba(18,183,106,0.34)]",
  peligro: "bg-blanco text-peligro border border-peligro-borde hover:bg-peligro-tint",
};

export function Boton({
  variante = "primario",
  tamanio = "normal",
  cargando = false,
  disabled,
  children,
  className,
  ...resto
}: Props) {
  return (
    <button
      className={combinarClases(BASE, TAMANIO[tamanio], VARIANTES[variante], className)}
      disabled={disabled || cargando}
      {...resto}
    >
      {cargando ? "Un momento…" : children}
    </button>
  );
}
