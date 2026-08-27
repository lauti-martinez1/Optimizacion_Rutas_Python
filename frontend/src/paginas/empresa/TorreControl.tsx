import { useEffect, useState } from "react";

import {
  obtenerKpisEmpresa,
  obtenerRutaEmpresa,
  obtenerRutasEmpresa,
  reoptimizarDia,
  reoptimizarRuta,
} from "../../api/empresa";
import { MapaTorreControl } from "../../componentes/empresa/MapaTorreControl";
import { Boton } from "../../componentes/ui/Boton";
import { ChipEstadoRuta, ChipRiesgo } from "../../componentes/ui/ChipEstado";
import { DatoNumerico } from "../../componentes/ui/DatoNumerico";
import { BannerError } from "../../componentes/ui/Formulario";
import { CabeceraTarjeta, TarjetaContenido, TituloTarjeta } from "../../componentes/ui/TarjetaContenido";
import { TarjetaLugar } from "../../componentes/ui/TarjetaLugar";
import { TextoEyebrow } from "../../componentes/ui/TextoEyebrow";
import { TextoVacio } from "../../componentes/ui/TextoVacio";
import { combinarClases } from "../../componentes/ui/combinarClases";
import type { KpisEmpresaDia, RutaResumenEmpresa } from "../../tipos/empresa";
import type { RutaPublica } from "../../tipos/ruta";

function TarjetaKpi({
  etiqueta,
  valor,
  detalle,
}: {
  etiqueta: string;
  valor: string;
  detalle?: string;
}) {
  return (
    <TarjetaContenido className="px-4 py-4">
      <TextoEyebrow className="mt-0">{etiqueta}</TextoEyebrow>
      <DatoNumerico as="p" className="text-2xl leading-tight font-bold text-texto-fuerte">
        {valor}
      </DatoNumerico>
      {detalle && <p className="mt-0.5 text-[11.5px] text-texto-mutado">{detalle}</p>}
    </TarjetaContenido>
  );
}

export function TorreControl() {
  const [rutas, setRutas] = useState<RutaResumenEmpresa[]>([]);
  const [kpis, setKpis] = useState<KpisEmpresaDia | null>(null);
  const [idSeleccionado, setIdSeleccionado] = useState<string | null>(null);
  const [detalle, setDetalle] = useState<RutaPublica | null>(null);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function recargarListado() {
    const [rutasResp, kpisResp] = await Promise.all([obtenerRutasEmpresa(), obtenerKpisEmpresa()]);
    setRutas(rutasResp);
    setKpis(kpisResp);
  }

  useEffect(() => {
    // oxlint no distingue que setRutas/setKpis ocurren después de un await —
    // mismo caso que PestanaInicio.tsx.
    // oxlint-disable-next-line react/set-state-in-effect
    recargarListado().finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    if (!idSeleccionado) {
      // oxlint-disable-next-line react/set-state-in-effect
      setDetalle(null);
      return;
    }
    obtenerRutaEmpresa(idSeleccionado)
      .then(setDetalle)
      .catch(() => setDetalle(null));
  }, [idSeleccionado]);

  async function manejarReoptimizarRuta() {
    if (!idSeleccionado) return;
    setError(null);
    setEnviando(true);
    try {
      const actualizada = await reoptimizarRuta(idSeleccionado);
      setDetalle(actualizada);
      await recargarListado();
    } catch {
      setError("No se pudo reoptimizar la ruta — puede que ya no queden paradas pendientes.");
    } finally {
      setEnviando(false);
    }
  }

  async function manejarReoptimizarDia() {
    setError(null);
    setEnviando(true);
    try {
      await reoptimizarDia();
      await recargarListado();
      if (idSeleccionado) {
        setDetalle(await obtenerRutaEmpresa(idSeleccionado));
      }
    } catch {
      setError("No se pudo reoptimizar el día.");
    } finally {
      setEnviando(false);
    }
  }

  if (cargando) {
    return <TextoVacio>Cargando…</TextoVacio>;
  }

  const resumenSeleccionado = rutas.find((r) => r.id === idSeleccionado) ?? null;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-texto-fuerte">Torre de control</h1>
          <p className="text-[12.5px] text-texto-mutado">{rutas.length} rutas en calle hoy</p>
        </div>
        <Boton tamanio="auto" cargando={enviando} onClick={manejarReoptimizarDia}>
          Reoptimizar día
        </Boton>
      </div>

      {error && <BannerError>{error}</BannerError>}

      {kpis && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <TarjetaKpi
            etiqueta="Rutas activas"
            valor={`${kpis.rutas_activas}`}
            detalle={`${kpis.rutas_completadas} completadas`}
          />
          <TarjetaKpi
            etiqueta="Entregas del día"
            valor={`${kpis.paradas_completadas}/${kpis.total_paradas}`}
            detalle={
              kpis.total_paradas > 0
                ? `${Math.round((100 * kpis.paradas_completadas) / kpis.total_paradas)}% completado`
                : undefined
            }
          />
          <TarjetaKpi etiqueta="Ventanas en riesgo" valor={`${kpis.rutas_en_riesgo}`} />
          <TarjetaKpi
            etiqueta="Paradas pendientes"
            valor={`${kpis.paradas_pendientes}`}
            detalle={`${kpis.paradas_fallidas} fallidas`}
          />
        </div>
      )}

      {rutas.length === 0 ? (
        <TarjetaContenido>
          <TextoVacio>Todavía no hay rutas asignadas para hoy.</TextoVacio>
        </TarjetaContenido>
      ) : (
        <div className="xl:grid xl:grid-cols-[1fr_380px] xl:items-start xl:gap-5">
          <div className="flex flex-col gap-4">
            <MapaTorreControl
              rutas={rutas}
              rutaSeleccionada={detalle}
              idSeleccionado={idSeleccionado}
              onSeleccionar={setIdSeleccionado}
            />

            <TarjetaContenido className="overflow-x-auto px-0 py-0">
              <table className="w-full text-left text-[12.5px]">
                <thead>
                  <tr className="border-b border-borde text-[11px] font-semibold tracking-[0.02em] text-texto-tenue uppercase">
                    <th className="px-4 py-3">Chofer</th>
                    <th className="px-4 py-3">Vehículo</th>
                    <th className="px-4 py-3">Avance</th>
                    <th className="px-4 py-3">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {rutas.map((ruta) => (
                    <tr
                      key={ruta.id}
                      className={combinarClases(
                        "cursor-pointer border-b border-borde last:border-0 hover:bg-fondo",
                        ruta.id === idSeleccionado && "bg-primario/[0.06]",
                      )}
                      onClick={() => setIdSeleccionado(ruta.id)}
                    >
                      <td className="px-4 py-3 font-semibold text-texto-fuerte">
                        {ruta.chofer_nombre}
                      </td>
                      <td className="px-4 py-3 text-texto-mutado">{ruta.vehiculo_patente}</td>
                      <td className="px-4 py-3">
                        <DatoNumerico>
                          {ruta.paradas_completadas}/{ruta.total_paradas} entregas
                        </DatoNumerico>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          <ChipEstadoRuta estado={ruta.estado} />
                          {ruta.en_riesgo && <ChipRiesgo />}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TarjetaContenido>
          </div>

          <TarjetaContenido className="xl:sticky xl:top-5">
            {!resumenSeleccionado || !detalle ? (
              <TextoVacio>Elegí una ruta del mapa o la tabla para ver su detalle.</TextoVacio>
            ) : (
              <div className="flex flex-col gap-4">
                <CabeceraTarjeta>
                  <TituloTarjeta>{resumenSeleccionado.chofer_nombre}</TituloTarjeta>
                  <ChipEstadoRuta estado={detalle.estado} />
                </CabeceraTarjeta>
                <p className="text-[12.5px] text-texto-mutado">
                  {resumenSeleccionado.vehiculo_patente}
                  {detalle.distancia_total_m != null &&
                    ` · ${(detalle.distancia_total_m / 1000).toFixed(1)} km`}
                </p>

                {resumenSeleccionado.en_riesgo && (
                  <BannerError>
                    Esta ruta tiene paradas fallidas o incidencias registradas — puede necesitar
                    reoptimizarse.
                  </BannerError>
                )}

                {detalle.explicacion && (
                  <p className="text-[12.5px] text-texto-mutado">{detalle.explicacion}</p>
                )}

                <ol className="flex max-h-[360px] flex-col gap-2.5 overflow-y-auto">
                  {detalle.paradas.map((parada) => (
                    <TarjetaLugar
                      key={parada.id}
                      numero={parada.orden + 1}
                      nombre={parada.nombre_snapshot}
                      direccion={parada.direccion_snapshot}
                      estado={parada.estado}
                      trailing={<DatoNumerico>{parada.demanda_carga_snapshot} kg</DatoNumerico>}
                    />
                  ))}
                </ol>

                <Boton variante="secundario" cargando={enviando} onClick={manejarReoptimizarRuta}>
                  Reoptimizar ruta
                </Boton>
              </div>
            )}
          </TarjetaContenido>
        </div>
      )}
    </div>
  );
}
