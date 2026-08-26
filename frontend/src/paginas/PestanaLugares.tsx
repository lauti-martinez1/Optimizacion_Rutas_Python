import { useEffect, useState } from "react";

import { eliminarCliente, listarClientes } from "../api/clientes";
import { FormularioCliente } from "../componentes/formularios/FormularioCliente";
import { FlujoArmarRuta } from "../componentes/rutas/FlujoArmarRuta";
import { Boton } from "../componentes/ui/Boton";
import type { ClientePublico } from "../tipos/cliente";

type Vista = "lista" | "formulario" | "ruta";

interface Props {
  onRutaConfirmada: () => void;
}

export function PestanaLugares({ onRutaConfirmada }: Props) {
  const [clientes, setClientes] = useState<ClientePublico[]>([]);
  const [cargando, setCargando] = useState(true);
  const [vista, setVista] = useState<Vista>("lista");
  const [clienteEditando, setClienteEditando] = useState<ClientePublico | null>(null);

  async function recargar() {
    setClientes(await listarClientes());
  }

  useEffect(() => {
    // oxlint no distingue que setClientes ocurre después de un await dentro
    // de recargar() — no hay setState síncrono ni loop de renders acá.
    // oxlint-disable-next-line react/set-state-in-effect
    recargar().finally(() => setCargando(false));
  }, []);

  function abrirNuevo() {
    setClienteEditando(null);
    setVista("formulario");
  }

  function abrirEdicion(cliente: ClientePublico) {
    setClienteEditando(cliente);
    setVista("formulario");
  }

  async function manejarGuardado() {
    setVista("lista");
    await recargar();
  }

  async function manejarEliminar(id: string) {
    await eliminarCliente(id);
    await recargar();
  }

  if (vista === "formulario") {
    return (
      <FormularioCliente
        cliente={clienteEditando}
        onGuardado={manejarGuardado}
        onCancelar={() => setVista("lista")}
      />
    );
  }

  if (vista === "ruta") {
    return (
      <FlujoArmarRuta
        clientes={clientes}
        onConfirmada={onRutaConfirmada}
        onCancelar={() => setVista("lista")}
      />
    );
  }

  return (
    <div className="pestana-lugares">
      <div className="fila-botones">
        <Boton variante="secundario" onClick={abrirNuevo}>
          + Agregar lugar
        </Boton>
        <Boton onClick={() => setVista("ruta")} disabled={clientes.length === 0}>
          Armar ruta
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
                <button className="enlace-volver" onClick={() => abrirEdicion(cliente)}>
                  Editar
                </button>
                <button
                  className="enlace-volver enlace-volver--peligro"
                  onClick={() => manejarEliminar(cliente.id)}
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
