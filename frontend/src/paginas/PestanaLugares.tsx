import { useEffect, useState } from "react";

import { eliminarCliente, listarClientes } from "../api/clientes";
import { FormularioCliente } from "../componentes/formularios/FormularioCliente";
import { Boton } from "../componentes/ui/Boton";
import type { ClientePublico } from "../tipos/cliente";

export function PestanaLugares() {
  const [clientes, setClientes] = useState<ClientePublico[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
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
    setMostrarFormulario(true);
  }

  function abrirEdicion(cliente: ClientePublico) {
    setClienteEditando(cliente);
    setMostrarFormulario(true);
  }

  async function manejarGuardado() {
    setMostrarFormulario(false);
    await recargar();
  }

  async function manejarEliminar(id: string) {
    await eliminarCliente(id);
    await recargar();
  }

  if (mostrarFormulario) {
    return (
      <FormularioCliente
        cliente={clienteEditando}
        onGuardado={manejarGuardado}
        onCancelar={() => setMostrarFormulario(false)}
      />
    );
  }

  return (
    <div className="pestana-lugares">
      <Boton onClick={abrirNuevo}>+ Agregar lugar</Boton>

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
