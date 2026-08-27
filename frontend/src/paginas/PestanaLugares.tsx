import { useEffect, useState } from "react";

import { eliminarCliente, listarClientes } from "../api/clientes";
import { listarDepositos } from "../api/depositos";
import { obtenerRutaActiva } from "../api/rutas";
import { FormularioCliente } from "../componentes/formularios/FormularioCliente";
import { FormularioDeposito } from "../componentes/formularios/FormularioDeposito";
import { FlujoArmarRuta } from "../componentes/rutas/FlujoArmarRuta";
import { Boton } from "../componentes/ui/Boton";
import type { ClientePublico } from "../tipos/cliente";
import type { DepositoPublico } from "../tipos/deposito";

type Vista = "lista" | "formulario" | "ruta" | "deposito";

interface Props {
  onRutaConfirmada: () => void;
  /** true: Inicio nos pide saltar directo a editar la ruta de hoy. */
  abrirEdicionRuta?: boolean;
  onAbrioEdicionRuta?: () => void;
}

export function PestanaLugares({
  onRutaConfirmada,
  abrirEdicionRuta = false,
  onAbrioEdicionRuta,
}: Props) {
  const [clientes, setClientes] = useState<ClientePublico[]>([]);
  const [deposito, setDeposito] = useState<DepositoPublico | null>(null);
  const [tieneRutaHoy, setTieneRutaHoy] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [vista, setVista] = useState<Vista>("lista");
  const [modoEdicionRuta, setModoEdicionRuta] = useState(false);
  const [clienteEditando, setClienteEditando] = useState<ClientePublico | null>(null);

  async function recargar() {
    const [listaClientes, listaDepositos, ruta] = await Promise.all([
      listarClientes(),
      listarDepositos(),
      obtenerRutaActiva(),
    ]);
    setClientes(listaClientes);
    setDeposito(listaDepositos[0] ?? null);
    setTieneRutaHoy(ruta !== null);
  }

  useEffect(() => {
    // oxlint no distingue que los setState ocurren después de un await
    // dentro de recargar() — no hay setState síncrono ni loop de renders acá.
    // oxlint-disable-next-line react/set-state-in-effect
    recargar().finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    // Sincroniza con una señal externa real (Inicio.tsx pidiendo saltar a
    // edición desde otra pestaña), no un valor derivable en el render.
    if (abrirEdicionRuta) {
      // oxlint-disable-next-line react/set-state-in-effect
      setModoEdicionRuta(true);
      setVista("ruta");
      onAbrioEdicionRuta?.();
    }
  }, [abrirEdicionRuta, onAbrioEdicionRuta]);

  function abrirNuevo() {
    setClienteEditando(null);
    setVista("formulario");
  }

  function abrirEdicionLugar(cliente: ClientePublico) {
    setClienteEditando(cliente);
    setVista("formulario");
  }

  function abrirArmarRutaNueva() {
    setModoEdicionRuta(false);
    setVista("ruta");
  }

  function abrirDeposito() {
    setVista("deposito");
  }

  async function manejarGuardadoLugar() {
    setVista("lista");
    await recargar();
  }

  async function manejarGuardadoDeposito() {
    setVista("lista");
    await recargar();
  }

  async function manejarEliminarLugar(id: string) {
    await eliminarCliente(id);
    await recargar();
  }

  async function manejarRutaGuardada() {
    setVista("lista");
    await recargar();
    onRutaConfirmada();
  }

  if (vista === "formulario") {
    return (
      <FormularioCliente
        cliente={clienteEditando}
        onGuardado={manejarGuardadoLugar}
        onCancelar={() => setVista("lista")}
      />
    );
  }

  if (vista === "ruta") {
    return (
      <FlujoArmarRuta
        clientes={clientes}
        modoEdicion={modoEdicionRuta}
        onConfirmada={manejarRutaGuardada}
        onCancelar={() => setVista("lista")}
      />
    );
  }

  if (vista === "deposito") {
    return (
      <FormularioDeposito
        deposito={deposito}
        onGuardado={manejarGuardadoDeposito}
        onCancelar={() => setVista("lista")}
      />
    );
  }

  return (
    <div className="pestana-lugares">
      {!cargando && (
        <div className="tarjeta-contenido">
          <div className="tarjeta-contenido__cabecera">
            <p className="tarjeta-contenido__titulo">Mi depósito</p>
            <button className="enlace-volver" onClick={abrirDeposito}>
              {deposito ? "Editar" : "+ Agregar"}
            </button>
          </div>
          <p className="texto-ayuda">
            {deposito
              ? `${deposito.nombre} — de acá parten y a acá vuelven tus rutas.`
              : "Todavía no marcaste de dónde salís y a dónde volvés cada día."}
          </p>
        </div>
      )}

      <div className="fila-botones">
        <Boton variante="secundario" onClick={abrirNuevo}>
          + Agregar lugar
        </Boton>
        <Boton
          onClick={abrirArmarRutaNueva}
          disabled={clientes.length === 0 || tieneRutaHoy}
          title={tieneRutaHoy ? "Ya tenés una ruta para hoy — editala desde Inicio" : undefined}
        >
          {tieneRutaHoy ? "Ya tenés ruta hoy" : "Armar ruta"}
        </Boton>
      </div>

      {cargando ? (
        <p className="texto-vacio">Cargando…</p>
      ) : clientes.length === 0 ? (
        <p className="texto-vacio">
          Todavía no guardaste ningún lugar. Agregá las direcciones que visitás seguido para no
          tener que cargarlas cada vez.
        </p>
      ) : (
        <ul className="lista-lugares">
          {clientes.map((cliente) => (
            <li key={cliente.id} className="tarjeta-lugar">
              <div className="tarjeta-lugar__info">
                <p className="tarjeta-lugar__nombre">{cliente.nombre}</p>
                <p className="tarjeta-lugar__direccion">{cliente.direccion}</p>
                {cliente.telefono && <p className="tarjeta-lugar__telefono">{cliente.telefono}</p>}
              </div>
              <div className="tarjeta-lugar__acciones">
                <button className="enlace-volver" onClick={() => abrirEdicionLugar(cliente)}>
                  Editar
                </button>
                <button
                  className="enlace-volver enlace-volver--peligro"
                  onClick={() => manejarEliminarLugar(cliente.id)}
                >
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
