import { useEffect, useState } from "react";

import { listarDepositos } from "../../api/depositos";
import { confirmarRuta, editarRuta, obtenerRutaActiva, optimizarRuta } from "../../api/rutas";
import { useEnvioFormulario } from "../../hooks/useEnvioFormulario";
import type { ClientePublico } from "../../tipos/cliente";
import type { RutaPreview } from "../../tipos/ruta";
import { FormularioDeposito } from "../formularios/FormularioDeposito";
import { Boton } from "../ui/Boton";

interface Props {
  clientes: ClientePublico[];
  /** true: reabre la ruta planificada de hoy con su selección precargada y
   * al confirmar la reemplaza (PUT), en vez de crear una nueva (POST). */
  modoEdicion?: boolean;
  onConfirmada: () => void;
  onCancelar: () => void;
}

type Vista = "cargando" | "deposito" | "seleccion" | "preview";

// cliente_id -> carga en kg de lo que se lleva ahí hoy. La clave de
// presencia en este objeto ES la selección (agregar/sacar una clave marca o
// desmarca el checkbox), evita duplicar el estado en dos lugares distintos.
type Seleccion = Record<string, number>;

export function FlujoArmarRuta({ clientes, modoEdicion = false, onConfirmada, onCancelar }: Props) {
  const [vista, setVista] = useState<Vista>("cargando");
  const [seleccion, setSeleccion] = useState<Seleccion>({});
  const [preview, setPreview] = useState<RutaPreview | null>(null);
  const { error, enviando, enviar } = useEnvioFormulario();

  useEffect(() => {
    if (modoEdicion) {
      // Si ya hay una ruta hoy, su depósito ya existe — no hace falta el
      // chequeo de depósito, directo a precargar la selección actual.
      obtenerRutaActiva().then((ruta) => {
        const seleccionActual: Seleccion = {};
        for (const parada of ruta?.paradas ?? []) {
          seleccionActual[parada.cliente_id] = parada.demanda_carga_snapshot;
        }
        setSeleccion(seleccionActual);
        setVista("seleccion");
      });
      return;
    }
    listarDepositos().then((depositos) => {
      setVista(depositos.length > 0 ? "seleccion" : "deposito");
    });
  }, [modoEdicion]);

  function alternarSeleccion(clienteId: string, marcado: boolean) {
    setSeleccion((actual) => {
      const siguiente = { ...actual };
      if (marcado) {
        siguiente[clienteId] = actual[clienteId] ?? 0;
      } else {
        delete siguiente[clienteId];
      }
      return siguiente;
    });
  }

  function cambiarCarga(clienteId: string, cargaKg: number) {
    setSeleccion((actual) => ({ ...actual, [clienteId]: cargaKg }));
  }

  function paradasSeleccionadas() {
    return Object.entries(seleccion).map(([cliente_id, carga_kg]) => ({ cliente_id, carga_kg }));
  }

  function manejarOptimizar() {
    enviar(async () => {
      const resultado = await optimizarRuta({ paradas: paradasSeleccionadas() });
      setPreview(resultado);
      setVista("preview");
    }, "No se pudo optimizar la ruta.");
  }

  function manejarConfirmar() {
    enviar(async () => {
      const guardar = modoEdicion ? editarRuta : confirmarRuta;
      await guardar({ paradas: paradasSeleccionadas() });
      onConfirmada();
    }, "No se pudo guardar la ruta.");
  }

  if (vista === "cargando") {
    return <p className="texto-vacio">Cargando…</p>;
  }

  if (vista === "deposito") {
    return <FormularioDeposito onGuardado={() => setVista("seleccion")} onCancelar={onCancelar} />;
  }

  if (vista === "preview" && preview) {
    return (
      <div className="flujo-ruta">
        <div className="tarjeta-contenido">
          <p className="tarjeta-contenido__titulo">
            {preview.paradas.length} paradas · {(preview.distancia_total_m / 1000).toFixed(1)} km ·{" "}
            {preview.carga_total_kg} kg
          </p>
          <p className="texto-ayuda">{preview.explicacion}</p>
          {preview.ahorro_m > 0 && (
            <p className="texto-ahorro">
              Te ahorrás {(preview.ahorro_m / 1000).toFixed(1)} km recorridos comparado con
              visitarlos en el orden en que los elegiste.
            </p>
          )}
        </div>
        {error && <div className="error-formulario">{error}</div>}
        <ol className="lista-lugares">
          {preview.paradas.map((parada) => (
            <li key={parada.cliente_id} className="tarjeta-lugar">
              <div className="tarjeta-lugar__info">
                <p className="tarjeta-lugar__nombre">
                  {parada.orden + 1}. {parada.nombre}
                </p>
                <p className="tarjeta-lugar__direccion">{parada.direccion}</p>
              </div>
              <span className="dato-numerico">
                {(parada.distancia_acumulada_m / 1000).toFixed(1)} km
              </span>
            </li>
          ))}
        </ol>
        <div className="fila-botones">
          <Boton type="button" variante="secundario" onClick={() => setVista("seleccion")}>
            Volver
          </Boton>
          <Boton type="button" variante="exito" cargando={enviando} onClick={manejarConfirmar}>
            {modoEdicion ? "Guardar cambios" : "Confirmar ruta"}
          </Boton>
        </div>
      </div>
    );
  }

  return (
    <div className="flujo-ruta">
      <p className="texto-ayuda">Elegí los lugares que visitás hoy y cuánto llevás a cada uno.</p>
      {error && <div className="error-formulario">{error}</div>}
      <ul className="lista-lugares">
        {clientes.map((cliente) => {
          const marcado = cliente.id in seleccion;
          return (
            <li key={cliente.id} className="tarjeta-lugar">
              <label className="tarjeta-lugar__seleccion">
                <input
                  type="checkbox"
                  checked={marcado}
                  onChange={(e) => alternarSeleccion(cliente.id, e.target.checked)}
                />
                <div className="tarjeta-lugar__info">
                  <p className="tarjeta-lugar__nombre">{cliente.nombre}</p>
                  <p className="tarjeta-lugar__direccion">{cliente.direccion}</p>
                </div>
              </label>
              {marcado && (
                <input
                  type="number"
                  min={0}
                  aria-label={`Carga en kg para ${cliente.nombre}`}
                  placeholder="kg"
                  className="campo__input campo__input--carga"
                  value={seleccion[cliente.id]}
                  onChange={(e) => cambiarCarga(cliente.id, Number(e.target.value))}
                />
              )}
            </li>
          );
        })}
      </ul>
      <div className="fila-botones">
        <Boton type="button" variante="secundario" onClick={onCancelar}>
          Cancelar
        </Boton>
        <Boton
          type="button"
          cargando={enviando}
          disabled={Object.keys(seleccion).length === 0}
          onClick={manejarOptimizar}
        >
          Optimizar ruta
        </Boton>
      </div>
    </div>
  );
}
