import { useEffect, useState } from "react";

import { listarDepositos } from "../../api/depositos";
import { confirmarRuta, editarRuta, obtenerRutaActiva, optimizarRuta } from "../../api/rutas";
import { useEnvioFormulario } from "../../hooks/useEnvioFormulario";
import type { ClientePublico } from "../../tipos/cliente";
import type { RutaPreview } from "../../tipos/ruta";
import { FormularioDeposito } from "../formularios/FormularioDeposito";
import { Boton } from "../ui/Boton";
import { TarjetaContenido } from "../ui/TarjetaContenido";
import { TarjetaLugar } from "../ui/TarjetaLugar";

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

const DATO_NUMERICO = "font-mono text-[12.5px] font-medium text-texto-cuerpo whitespace-nowrap shrink-0";

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
    return <p className="px-2 py-6 text-center text-[13px] text-texto-mutado">Cargando…</p>;
  }

  if (vista === "deposito") {
    return <FormularioDeposito onGuardado={() => setVista("seleccion")} onCancelar={onCancelar} />;
  }

  if (vista === "preview" && preview) {
    return (
      <div className="flex flex-col gap-4">
        <TarjetaContenido>
          <p className="mb-1.5 text-sm font-bold text-texto-fuerte">
            {preview.paradas.length} paradas · {(preview.distancia_total_m / 1000).toFixed(1)} km ·{" "}
            {preview.carga_total_kg} kg
          </p>
          <p className="text-[12.5px] text-texto-mutado">{preview.explicacion}</p>
          {preview.ahorro_m > 0 && (
            <p className="mt-2 text-[12.5px] font-semibold text-exito">
              Te ahorrás {(preview.ahorro_m / 1000).toFixed(1)} km recorridos comparado con
              visitarlos en el orden en que los elegiste.
            </p>
          )}
        </TarjetaContenido>
        {error && (
          <div className="rounded-md border border-peligro-borde bg-peligro-tint px-3 py-2.5 text-[12.5px] text-peligro">
            {error}
          </div>
        )}
        <ol className="flex flex-col gap-2.5">
          {preview.paradas.map((parada) => (
            <li
              key={parada.cliente_id}
              className="flex items-start justify-between gap-3 rounded-lg bg-blanco px-4 py-3.5 shadow-sm"
            >
              <div className="min-w-0 flex-1">
                <p className="mb-0.5 text-[13.5px] font-semibold text-texto-fuerte">
                  {parada.orden + 1}. {parada.nombre}
                </p>
                <p className="text-[12.5px] text-texto-cuerpo">{parada.direccion}</p>
              </div>
              <span className={DATO_NUMERICO}>{(parada.distancia_acumulada_m / 1000).toFixed(1)} km</span>
            </li>
          ))}
        </ol>
        <div className="flex gap-2.5 [&>*]:flex-1">
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
    <div className="flex flex-col gap-4">
      <p className="text-[12.5px] text-texto-mutado">
        Elegí los lugares que visitás hoy y cuánto llevás a cada uno.
      </p>
      {error && (
        <div className="rounded-md border border-peligro-borde bg-peligro-tint px-3 py-2.5 text-[12.5px] text-peligro">
          {error}
        </div>
      )}
      <ul className="flex flex-col gap-2.5 xl:grid xl:grid-cols-2 xl:gap-3">
        {clientes.map((cliente) => {
          const marcado = cliente.id in seleccion;
          return (
            <TarjetaLugar
              key={cliente.id}
              nombre={cliente.nombre}
              direccion={cliente.direccion}
              seleccionable={{
                marcado,
                onCambiar: (valor) => alternarSeleccion(cliente.id, valor),
              }}
              trailing={
                marcado && (
                  <input
                    type="number"
                    min={0}
                    aria-label={`Carga en kg para ${cliente.nombre}`}
                    placeholder="kg"
                    className="h-9 w-16 shrink-0 rounded-md border border-borde-input bg-blanco px-2 text-right font-mono text-sm text-texto-fuerte outline-none transition-[border-color,box-shadow] duration-150 focus:border-primario focus:shadow-[0_0_0_3px_rgba(124,58,237,0.15)] focus-visible:outline-none"
                    value={seleccion[cliente.id]}
                    onChange={(e) => cambiarCarga(cliente.id, Number(e.target.value))}
                  />
                )
              }
            />
          );
        })}
      </ul>
      <div className="flex gap-2.5 [&>*]:flex-1">
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
