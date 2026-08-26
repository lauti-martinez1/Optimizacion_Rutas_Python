import { type FormEvent, useState } from "react";

import { ErrorFormulario } from "../../api/cliente";
import { crearDeposito } from "../../api/depositos";
import { useEnvioFormulario } from "../../hooks/useEnvioFormulario";
import type { DepositoPublico } from "../../tipos/deposito";
import { SelectorUbicacion } from "../mapa/SelectorUbicacion";
import { Boton } from "../ui/Boton";
import { Campo } from "../ui/Campo";

interface Props {
  onGuardado: (deposito: DepositoPublico) => void;
  onCancelar: () => void;
}

export function FormularioDeposito({ onGuardado, onCancelar }: Props) {
  const { error, enviando, enviar } = useEnvioFormulario();
  const [nombre, setNombre] = useState("Mi base");
  const [latitud, setLatitud] = useState<number | null>(null);
  const [longitud, setLongitud] = useState<number | null>(null);

  function manejarSubmit(evento: FormEvent) {
    evento.preventDefault();
    enviar(async () => {
      if (latitud == null || longitud == null) {
        throw new ErrorFormulario("Marcá en el mapa dónde arrancás y terminás tu día.");
      }
      const deposito = await crearDeposito({ nombre, latitud, longitud });
      onGuardado(deposito);
    }, "No se pudo guardar el depósito.");
  }

  return (
    <form onSubmit={manejarSubmit} className="formulario-lugar">
      <p className="texto-ayuda">
        Antes de armar tu primera ruta necesitamos saber de dónde salís y a dónde volvés — tu
        casa, tu local, o donde arranques el día.
      </p>
      {error && <div className="error-formulario">{error}</div>}
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
