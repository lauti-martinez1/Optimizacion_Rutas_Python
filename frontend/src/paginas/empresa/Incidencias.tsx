import { type FormEvent, useEffect, useState } from "react";

import { obtenerRutaEmpresa, obtenerRutasEmpresa } from "../../api/empresa";
import { crearIncidencia, listarIncidencias } from "../../api/incidencias";
import { OPCIONES_TIPO_INCIDENCIA } from "../../componentes/formularios/opcionesIncidencia";
import { Boton } from "../../componentes/ui/Boton";
import { Campo } from "../../componentes/ui/Campo";
import { CampoSelect } from "../../componentes/ui/CampoSelect";
import { Formulario } from "../../componentes/ui/Formulario";
import { TarjetaContenido } from "../../componentes/ui/TarjetaContenido";
import { TextoVacio } from "../../componentes/ui/TextoVacio";
import { useEnvioFormulario } from "../../hooks/useEnvioFormulario";
import type { RutaResumenEmpresa } from "../../tipos/empresa";
import type { IncidenciaPublica, TipoIncidencia } from "../../tipos/incidencia";
import type { ParadaRutaPublica } from "../../tipos/ruta";

const ETIQUETA_TIPO = Object.fromEntries(
  OPCIONES_TIPO_INCIDENCIA.map((opcion) => [opcion.valor, opcion.etiqueta]),
);

export function Incidencias() {
  const [incidencias, setIncidencias] = useState<IncidenciaPublica[]>([]);
  const [rutas, setRutas] = useState<RutaResumenEmpresa[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const { error, enviando, enviar } = useEnvioFormulario();

  const [rutaId, setRutaId] = useState("");
  const [paradaId, setParadaId] = useState("");
  const [paradasDeRuta, setParadasDeRuta] = useState<ParadaRutaPublica[]>([]);
  const [tipo, setTipo] = useState<TipoIncidencia>("otro");
  const [descripcion, setDescripcion] = useState("");

  async function recargar() {
    const [incidenciasResp, rutasResp] = await Promise.all([
      listarIncidencias(),
      obtenerRutasEmpresa(),
    ]);
    setIncidencias(incidenciasResp);
    setRutas(rutasResp);
  }

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    recargar().finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    if (!rutaId) {
      // oxlint-disable-next-line react/set-state-in-effect
      setParadasDeRuta([]);
      return;
    }
    obtenerRutaEmpresa(rutaId)
      .then((ruta) => setParadasDeRuta(ruta.paradas))
      .catch(() => setParadasDeRuta([]));
  }, [rutaId]);

  function nombreChofer(idRuta: string) {
    return rutas.find((ruta) => ruta.id === idRuta)?.chofer_nombre ?? "—";
  }

  function manejarSubmit(evento: FormEvent) {
    evento.preventDefault();
    enviar(async () => {
      await crearIncidencia({
        ruta_id: rutaId,
        parada_id: paradaId || null,
        tipo,
        descripcion: descripcion || null,
      });
      setRutaId("");
      setParadaId("");
      setDescripcion("");
      setTipo("otro");
      setMostrarFormulario(false);
      await recargar();
    }, "No se pudo registrar la incidencia.");
  }

  if (cargando) {
    return <TextoVacio>Cargando…</TextoVacio>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-texto-fuerte">Incidencias</h1>
          <p className="text-[12.5px] text-texto-mutado">
            {incidencias.length} incidencias registradas
          </p>
        </div>
        <Boton
          tamanio="auto"
          onClick={() => setMostrarFormulario((valor) => !valor)}
          disabled={rutas.length === 0}
        >
          {mostrarFormulario ? "Cancelar" : "Registrar incidencia"}
        </Boton>
      </div>

      {rutas.length === 0 && (
        <TarjetaContenido>
          <TextoVacio>
            Necesitás al menos una ruta asignada hoy para poder registrar una incidencia.
          </TextoVacio>
        </TarjetaContenido>
      )}

      {mostrarFormulario && (
        <TarjetaContenido>
          <Formulario error={error} onSubmit={manejarSubmit}>
            <CampoSelect
              etiqueta="Ruta"
              placeholder="Elegí una ruta"
              opciones={rutas.map((ruta) => ({
                valor: ruta.id,
                etiqueta: `${ruta.chofer_nombre} · ${ruta.vehiculo_patente}`,
              }))}
              value={rutaId}
              onChange={(e) => {
                setRutaId(e.target.value);
                setParadaId("");
              }}
              required
            />
            <CampoSelect
              etiqueta="Parada (opcional)"
              placeholder="Incidencia general de la ruta"
              opciones={paradasDeRuta.map((parada) => ({
                valor: parada.id,
                etiqueta: parada.nombre_snapshot,
              }))}
              value={paradaId}
              onChange={(e) => setParadaId(e.target.value)}
              disabled={!rutaId}
            />
            <CampoSelect
              etiqueta="Tipo"
              opciones={OPCIONES_TIPO_INCIDENCIA}
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TipoIncidencia)}
            />
            <Campo
              etiqueta="Descripción (opcional)"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
            <Boton type="submit" cargando={enviando}>
              Guardar incidencia
            </Boton>
          </Formulario>
        </TarjetaContenido>
      )}

      {incidencias.length === 0 ? (
        <TarjetaContenido>
          <TextoVacio>No hay incidencias registradas.</TextoVacio>
        </TarjetaContenido>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {incidencias.map((incidencia) => (
            <li key={incidencia.id}>
              <TarjetaContenido className="px-4 py-3.5">
                <p className="text-[13.5px] font-semibold text-texto-fuerte">
                  {ETIQUETA_TIPO[incidencia.tipo]}
                </p>
                <p className="text-[12px] text-texto-mutado">
                  {nombreChofer(incidencia.ruta_id)} ·{" "}
                  {new Date(incidencia.fecha_hora).toLocaleString("es-AR")}
                </p>
                {incidencia.descripcion && (
                  <p className="mt-1 text-[12.5px] text-texto-cuerpo">{incidencia.descripcion}</p>
                )}
              </TarjetaContenido>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
