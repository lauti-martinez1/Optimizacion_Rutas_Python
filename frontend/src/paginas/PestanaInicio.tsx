import { useEffect, useState } from "react";

import { completarParada, eliminarRuta, iniciarRuta, obtenerRutaActiva } from "../api/rutas";
import { MapaRutaActiva } from "../componentes/rutas/MapaRutaActiva";
import { Boton } from "../componentes/ui/Boton";
import type { EstadoRuta, RutaPublica } from "../tipos/ruta";

const ETIQUETA_ESTADO: Record<EstadoRuta, string> = {
  planificada: "Planificada",
  en_curso: "En curso",
  completada: "Completada",
  cancelada: "Cancelada",
};

interface Props {
  onEditar: () => void;
}

export function PestanaInicio({ onEditar }: Props) {
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
    return <p className="texto-vacio">Cargando…</p>;
  }

  if (!ruta) {
    return (
      <div className="tarjeta-contenido">
        <p>Todavía no tenés rutas asignadas.</p>
      </div>
    );
  }

  const paradasCompletadas = ruta.paradas.filter((parada) => parada.estado === "completada").length;
  const cargaTotalKg = ruta.paradas.reduce((suma, parada) => suma + parada.demanda_carga_snapshot, 0);
  const cargaUsadaPct = Math.min(100, Math.round((cargaTotalKg / ruta.capacidad_vehiculo_kg) * 100));

  return (
    <div className="pestana-lugares">
      <div className="tarjeta-contenido">
        <div className="tarjeta-contenido__cabecera">
          <p className="tarjeta-contenido__titulo">Ruta de hoy</p>
          <span className={`chip-estado chip-estado--${ruta.estado}`}>
            <span className="chip-estado__punto" />
            {ETIQUETA_ESTADO[ruta.estado]}
          </span>
        </div>
        <p className="dato-numerico">
          {ruta.paradas.length} paradas
          {ruta.distancia_total_m != null && ` · ${(ruta.distancia_total_m / 1000).toFixed(1)} km`}
        </p>
        {(ruta.estado === "planificada" || ruta.estado === "en_curso") && (
          <div className="resumen-ruta__stats">
            <div className="resumen-ruta__stat">
              <span className="resumen-ruta__valor">
                {paradasCompletadas}
                <span className="resumen-ruta__valor-total">/{ruta.paradas.length}</span>
              </span>
              <span className="resumen-ruta__etiqueta">entregas completadas</span>
            </div>
            <div className="resumen-ruta__stat">
              <span className="resumen-ruta__valor">{cargaUsadaPct}%</span>
              <span className="resumen-ruta__etiqueta">carga del vehículo</span>
            </div>
          </div>
        )}
      </div>

      {error && <div className="error-formulario">{error}</div>}

      {ruta.estado === "en_curso" && (
        <MapaRutaActiva deposito={ruta.deposito} paradas={ruta.paradas} />
      )}

      <ol className="lista-lugares">
        {ruta.paradas.map((parada) => (
          <li
            key={parada.id}
            className={
              "tarjeta-lugar" +
              (parada.estado === "en_curso" ? " tarjeta-lugar--en-curso" : "") +
              (parada.estado === "completada" ? " tarjeta-lugar--completada" : "")
            }
          >
            <span className="tarjeta-lugar__numero">{parada.orden + 1}</span>
            <div className="tarjeta-lugar__info">
              <p className="tarjeta-lugar__nombre">{parada.nombre_snapshot}</p>
              <p className="tarjeta-lugar__direccion">{parada.direccion_snapshot}</p>
            </div>
            {parada.estado === "en_curso" ? (
              <Boton
                variante="exito"
                className="boton--chica"
                cargando={enviando}
                onClick={() =>
                  ejecutar(() => completarParada(parada.id), "No se pudo marcar la parada.")
                }
              >
                Marcar visitada
              </Boton>
            ) : (
              <span className="dato-numerico">{parada.demanda_carga_snapshot} kg</span>
            )}
          </li>
        ))}
      </ol>

      {ruta.estado === "planificada" && (
        <>
          <Boton
            variante="exito"
            cargando={enviando}
            onClick={() => ejecutar(() => iniciarRuta(), "No se pudo iniciar la ruta.")}
          >
            Iniciar ruta
          </Boton>
          <div className="fila-botones">
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

      {ruta.estado === "completada" && (
        <div className="tarjeta-contenido">
          <p>
            ¡Ruta completada
            {ruta.distancia_total_m != null &&
              ` — recorriste ${(ruta.distancia_total_m / 1000).toFixed(1)} km`}
            !
          </p>
        </div>
      )}
    </div>
  );
}
