import { combinarClases } from "./combinarClases";
import type { EstadoRuta } from "../../tipos/ruta";

type Tono = "neutro" | "exito" | "peligro";

interface Props {
  etiqueta: string;
  tono: Tono;
  conPulso?: boolean;
  className?: string;
}

const CLASE_TONO: Record<Tono, string> = {
  neutro: "bg-primario/10 text-primario",
  exito: "bg-exito-tint text-exito",
  peligro: "bg-peligro-tint text-peligro",
};

/** Pill de estado del design system (DESIGN.md): fondo = tinte semántico,
 * texto = color sólido, punto pulsante opcional para "en curso". Antes vivía
 * duplicado inline en PestanaInicio — ahora también lo usa el dashboard de
 * empresa (rutas, paradas, riesgo). */
export function ChipEstado({ etiqueta, tono, conPulso = false, className }: Props) {
  return (
    <span
      className={combinarClases(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-pill px-2.5 py-1 text-[11px] font-semibold tracking-[0.02em]",
        CLASE_TONO[tono],
        className,
      )}
    >
      <span
        className={combinarClases(
          "h-1.5 w-1.5 shrink-0 rounded-full bg-current",
          conPulso && "animate-pulso-chip motion-reduce:animate-none",
        )}
      />
      {etiqueta}
    </span>
  );
}

const ETIQUETA_ESTADO_RUTA: Record<EstadoRuta, string> = {
  planificada: "Planificada",
  en_curso: "En curso",
  completada: "Completada",
  cancelada: "Cancelada",
};

const TONO_ESTADO_RUTA: Record<EstadoRuta, Tono> = {
  planificada: "neutro",
  en_curso: "exito",
  completada: "exito",
  cancelada: "peligro",
};

export function ChipEstadoRuta({ estado, className }: { estado: EstadoRuta; className?: string }) {
  return (
    <ChipEstado
      etiqueta={ETIQUETA_ESTADO_RUTA[estado]}
      tono={TONO_ESTADO_RUTA[estado]}
      conPulso={estado === "en_curso"}
      className={className}
    />
  );
}

export function ChipRiesgo({ className }: { className?: string }) {
  return <ChipEstado etiqueta="En riesgo" tono="peligro" className={className} />;
}
