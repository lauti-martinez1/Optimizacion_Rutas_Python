import { type FormEvent, useState } from "react";

import { actualizarCliente, crearCliente } from "../../api/clientes";
import { ErrorFormulario } from "../../api/cliente";
import { useEnvioFormulario } from "../../hooks/useEnvioFormulario";
import type { ClientePublico } from "../../tipos/cliente";
import { SelectorUbicacion } from "../mapa/SelectorUbicacion";
import { Boton } from "../ui/Boton";
import { Campo } from "../ui/Campo";

interface Props {
  cliente: ClientePublico | null;
  onGuardado: () => void;
  onCancelar: () => void;
}

export function FormularioCliente({ cliente, onGuardado, onCancelar }: Props) {
  const { error, enviando, enviar } = useEnvioFormulario();
  const [nombre, setNombre] = useState(cliente?.nombre ?? "");
  const [direccion, setDireccion] = useState(cliente?.direccion ?? "");
  const [telefono, setTelefono] = useState(cliente?.telefono ?? "");
  const [latitud, setLatitud] = useState<number | null>(cliente?.latitud ?? null);
  const [longitud, setLongitud] = useState<number | null>(cliente?.longitud ?? null);

  function manejarSubmit(evento: FormEvent) {
    evento.preventDefault();
    enviar(async () => {
      if (latitud == null || longitud == null) {
        throw new ErrorFormulario("Marcá la ubicación en el mapa antes de guardar.");
      }
      const datos = { nombre, direccion, telefono: telefono || null, latitud, longitud };
      if (cliente) {
        await actualizarCliente(cliente.id, datos);
      } else {
        await crearCliente(datos);
      }
      onGuardado();
    }, "No se pudo guardar el lugar.");
  }

  return (
    <form onSubmit={manejarSubmit} className="formulario-lugar">
      {error && <div className="error-formulario">{error}</div>}
      <Campo
        etiqueta="Nombre"
        placeholder="Ej: Kiosco Don José"
        required
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
      />
      <Campo
        etiqueta="Dirección"
        placeholder="Calle, número, ciudad"
        required
        value={direccion}
        onChange={(e) => setDireccion(e.target.value)}
      />
      <Campo
        etiqueta="Teléfono (opcional)"
        type="tel"
        placeholder="+54 9 261 555-0100"
        value={telefono}
        onChange={(e) => setTelefono(e.target.value)}
      />
      <SelectorUbicacion
        latitud={latitud}
        longitud={longitud}
        onCambiar={(lat, lon, direccionSugerida) => {
          setLatitud(lat);
          setLongitud(lon);
          if (direccionSugerida) setDireccion(direccionSugerida);
        }}
      />
      <div className="fila-botones">
        <Boton type="button" variante="secundario" onClick={onCancelar}>
          Cancelar
        </Boton>
        <Boton type="submit" cargando={enviando}>
          Guardar
        </Boton>
      </div>
    </form>
  );
}
