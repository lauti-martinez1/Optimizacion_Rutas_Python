import { type FormEvent, useState } from "react";

import { ErrorFormulario } from "../../api/cliente";
import { actualizarDeposito, crearDeposito } from "../../api/depositos";
import { useEnvioFormulario } from "../../hooks/useEnvioFormulario";
import type { DepositoPublico } from "../../tipos/deposito";
import { SelectorUbicacion } from "../mapa/SelectorUbicacion";
import { Boton } from "../ui/Boton";
import { Campo } from "../ui/Campo";
import { Formulario } from "../ui/Formulario";

interface Props {
  deposito?: DepositoPublico | null;
  onGuardado: (deposito: DepositoPublico) => void;
  onCancelar: () => void;
}

export function FormularioDeposito({ deposito = null, onGuardado, onCancelar }: Props) {
  const { error, enviando, enviar } = useEnvioFormulario();
  const [nombre, setNombre] = useState(deposito?.nombre ?? "Mi base");
  const [latitud, setLatitud] = useState<number | null>(deposito?.latitud ?? null);
  const [longitud, setLongitud] = useState<number | null>(deposito?.longitud ?? null);
  // El Depósito no tiene columna de dirección — este texto es solo la
  // confirmación visual de SelectorUbicacion, nunca se guarda.
  const [direccion, setDireccion] = useState("");

  function manejarSubmit(evento: FormEvent) {
    evento.preventDefault();
    enviar(async () => {
      if (latitud == null || longitud == null) {
        throw new ErrorFormulario("Marcá en el mapa dónde arrancás y terminás tu día.");
      }
      const datos = { nombre, latitud, longitud };
      const guardado = deposito
        ? await actualizarDeposito(deposito.id, datos)
        : await crearDeposito(datos);
      onGuardado(guardado);
    }, "No se pudo guardar el depósito.");
  }

  return (
    <Formulario onSubmit={manejarSubmit} error={error} className="flex flex-col">
      <p className="text-[12.5px] text-texto-mutado">
        {deposito
          ? "Este es el punto de partida y llegada de tus rutas — tu casa, tu local, o donde arranques el día."
          : "Antes de armar tu primera ruta necesitamos saber de dónde salís y a dónde volvés — tu casa, tu local, o donde arranques el día."}
      </p>
      <Campo
        etiqueta="Nombre"
        placeholder="Ej: Mi base"
        required
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
      />
      <SelectorUbicacion
        latitud={latitud}
        longitud={longitud}
        onCambiar={(lat, lon) => {
          setLatitud(lat);
          setLongitud(lon);
        }}
        direccion={direccion}
        onCambiarDireccion={setDireccion}
      />
      <div className="flex gap-2.5 [&>*]:flex-1">
        <Boton type="button" variante="secundario" onClick={onCancelar}>
          Cancelar
        </Boton>
        <Boton type="submit" cargando={enviando}>
          Guardar
        </Boton>
      </div>
    </Formulario>
  );
}
