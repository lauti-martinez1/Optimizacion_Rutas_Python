import { useEffect, useState } from "react";

import { completarParada, eliminarRuta, iniciarRuta, obtenerRutaActiva } from "../api/rutas";
import { MapaRutaActiva } from "../componentes/rutas/MapaRutaActiva";
import { Boton } from "../componentes/ui/Boton";
import { CabeceraTarjeta, TarjetaContenido, TituloTarjeta } from "../componentes/ui/TarjetaContenido";
import { TarjetaLugar } from "../componentes/ui/TarjetaLugar";
import { TextoEyebrow } from "../componentes/ui/TextoEyebrow";
import { combinarClases } from "../componentes/ui/combinarClases";
import type { EstadoRuta, RutaPublica } from "../tipos/ruta";

const ETIQUETA_ESTADO: Record<EstadoRuta, string> = {
  planificada: "Planificada",
  en_curso: "En curso",
  completada: "Completada",
  cancelada: "Cancelada",
};

const CHIP_ESTADO: Record<EstadoRuta, string> = {
  planificada: "bg-primario/10 text-primario",
  en_curso: "bg-exito-tint text-exito",
  completada: "bg-exito-tint text-exito",
  cancelada: "bg-peligro-tint text-peligro",
};

const DATO_NUMERICO = "font-mono text-[12.5px] font-medium text-texto-cuerpo whitespace-nowrap shrink-0";

interface Props {
  onEditar: () => void;
  /** undefined: este usuario no arma su propia ruta (chofer de empresa,
   * admin) — no hay a dónde mandarlo, así que el estado vacío no ofrece CTA. */
  onArmarRuta?: () => void;
}

export function PestanaInicio({ onEditar, onArmarRuta }: Props) {
  const [ruta, setRuta] = useState<RutaPublica | null>(null);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function recargar() {
    setRuta(await obtenerRutaActiva());
  }

  useEffect(() => {
    // oxlint no distingue que setRuta ocurre después de un await dentro de
    // recargar() — no hay setState síncrono ni loop de renders acá.
    // oxlint-disable-next-line react/set-state-in-effect
    recargar().finally(() => setCargando(false));
  }, []);

  /** Iniciar/completar devuelven la Ruta actualizada — la usamos tal cual en
   * vez de recargar vía GET /activa, que ya no encuentra una ruta recién
   * completada (esa deja de contar como "activa") y pisaría el resumen
   * final con el estado vacío antes de que el chofer llegue a verlo.
   * Eliminar no devuelve una Ruta (queda cancelada, deja de ser "activa"),
   * así que su acción se pasa sin valor de retorno y siempre recarga. */
  async function ejecutar(accion: () => Promise<RutaPublica | void>, mensajeError: string) {
    setError(null);
    setEnviando(true);
    try {
      const resultado = await accion();
      if (resultado) {
        setRuta(resultado);
      } else {
        await recargar();
      }
    } catch {
      setError(mensajeError);
    } finally {
      setEnviando(false);
    }
  }

  if (cargando) {
    return <p className="px-2 py-6 text-center text-[13px] text-texto-mutado">Cargando…</p>;
  }

  if (!ruta) {
    return (
      <div className="flex flex-col items-center gap-1 px-5 pt-12 pb-8 text-center">
        <svg className="mb-3 h-12 w-12" viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <path
            d="M8 34c6-10 10-14 16-14s10 4 16 14"
            stroke="var(--color-borde-input)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="1 7"
          />
          <circle cx="8" cy="34" r="4" fill="var(--color-texto-fuerte)" />
          <circle cx="40" cy="34" r="4" fill="var(--color-primario)" />
        </svg>
        <p className="text-[15px] font-bold text-texto-fuerte">Todavía no armaste la ruta de hoy</p>
        <p className="mb-5 max-w-[280px] text-[13px] text-texto-mutado">
          Elegí los lugares que visitás y te armamos el mejor orden para recorrerlos.
        </p>
        {onArmarRuta && (
          <Boton tamanio="auto" onClick={onArmarRuta}>
            Armar ruta de hoy
          </Boton>
        )}
      </div>
    );
  }

  const paradasCompletadas = ruta.paradas.filter((parada) => parada.estado === "completada").length;
  const cargaTotalKg = ruta.paradas.reduce((suma, parada) => suma + parada.demanda_carga_snapshot, 0);
  const cargaUsadaPct = Math.min(100, Math.round((cargaTotalKg / ruta.capacidad_vehiculo_kg) * 100));
  const conMapa = ruta.estado === "en_curso";

  return (
    <div className="flex flex-col gap-4">
      <TarjetaContenido>
        <CabeceraTarjeta>
          <TituloTarjeta>Ruta de hoy</TituloTarjeta>
          <span
            className={combinarClases(
              "inline-flex items-center gap-1.5 whitespace-nowrap rounded-pill px-2.5 py-1 text-[11px] font-semibold tracking-[0.02em]",
              CHIP_ESTADO[ruta.estado],
            )}
          >
            <span
              className={combinarClases(
                "h-1.5 w-1.5 shrink-0 rounded-full bg-current",
                ruta.estado === "en_curso" && "animate-pulso-chip motion-reduce:animate-none",
              )}
            />
            {ETIQUETA_ESTADO[ruta.estado]}
          </span>
        </CabeceraTarjeta>
        <p className={DATO_NUMERICO}>
          {ruta.paradas.length} paradas
          {ruta.distancia_total_m != null && ` · ${(ruta.distancia_total_m / 1000).toFixed(1)} km`}
        </p>
        {ruta.explicacion && <p className="text-[12.5px] text-texto-mutado">{ruta.explicacion}</p>}
        {(ruta.estado === "planificada" || ruta.estado === "en_curso") && (
          <>
            <TextoEyebrow>Progreso del día</TextoEyebrow>
            <div className="flex items-end justify-between gap-3 border-t border-borde pt-3">
              <div className="flex flex-col gap-[3px]">
                <span className="font-mono text-[28px] leading-none font-bold text-primario">
                  {paradasCompletadas}
                  <span className="text-[19px] text-texto-tenue">/{ruta.paradas.length}</span>
                </span>
                <span className="text-[11.5px] font-medium text-texto-mutado">entregas completadas</span>
              </div>
              <div className="flex flex-col items-end gap-[3px]">
                <span className="text-[15px] font-semibold text-texto-fuerte">{cargaUsadaPct}%</span>
                <span className="text-[10.5px] text-texto-tenue">carga</span>
              </div>
            </div>
          </>
        )}
      </TarjetaContenido>

      {error && (
        <div className="rounded-md border border-peligro-borde bg-peligro-tint px-3 py-2.5 text-[12.5px] text-peligro">
          {error}
        </div>
      )}

      <div className={conMapa ? "xl:grid xl:grid-cols-[1fr_380px] xl:items-start xl:gap-5" : undefined}>
        {conMapa && <MapaRutaActiva deposito={ruta.deposito} paradas={ruta.paradas} />}

        <ol className={combinarClases("flex flex-col gap-2.5", conMapa && "xl:max-h-[520px] xl:overflow-y-auto")}>
          {ruta.paradas.map((parada) => (
            <TarjetaLugar
              key={parada.id}
              numero={parada.orden + 1}
              nombre={parada.nombre_snapshot}
              direccion={parada.direccion_snapshot}
              estado={parada.estado === "en_curso" || parada.estado === "completada" ? parada.estado : undefined}
              trailing={
                parada.estado === "en_curso" ? (
                  <Boton
                    variante="exito"
                    tamanio="chica"
                    cargando={enviando}
                    onClick={() =>
                      ejecutar(() => completarParada(parada.id), "No se pudo marcar la parada.")
                    }
                  >
                    Marcar visitada
                  </Boton>
                ) : (
                  <span className={DATO_NUMERICO}>{parada.demanda_carga_snapshot} kg</span>
                )
              }
            />
          ))}
        </ol>
      </div>

      {ruta.estado === "planificada" && (
        <>
          <Boton
            variante="exito"
            cargando={enviando}
            onClick={() => ejecutar(() => iniciarRuta(), "No se pudo iniciar la ruta.")}
          >
            Iniciar ruta
          </Boton>
          <div className="mt-2 flex gap-2.5 [&>*]:flex-1">
            <Boton variante="secundario" onClick={onEditar}>
              Editar
            </Boton>
            <Boton
              variante="peligro"
              cargando={enviando}
              onClick={() =>
                ejecutar(() => eliminarRuta().then(() => undefined), "No se pudo eliminar la ruta.")
              }
            >
              Eliminar
            </Boton>
          </div>
        </>
      )}

      {ruta.estado === "en_curso" && (
        <Boton
          variante="peligro"
          cargando={enviando}
          onClick={() =>
            ejecutar(() => eliminarRuta().then(() => undefined), "No se pudo cancelar la ruta.")
          }
        >
          Cancelar ruta
        </Boton>
      )}

      {ruta.estado === "completada" && (
        <TarjetaContenido>
          <p>
            ¡Ruta completada
            {ruta.distancia_total_m != null &&
              ` — recorriste ${(ruta.distancia_total_m / 1000).toFixed(1)} km`}
            !
          </p>
        </TarjetaContenido>
      )}
    </div>
  );
}
