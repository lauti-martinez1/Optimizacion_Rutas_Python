import type { TipoVehiculo } from "../../tipos/auth";
import { Campo } from "../ui/Campo";
import { CampoSelect } from "../ui/CampoSelect";
import type { ValoresVehiculo } from "./datosRegistro";
import { OPCIONES_TIPO_VEHICULO } from "./opcionesVehiculo";

interface Props {
  valores: ValoresVehiculo;
  onCambiar: <K extends keyof ValoresVehiculo>(campo: K, valor: ValoresVehiculo[K]) => void;
}

export function CamposVehiculo({ valores, onCambiar }: Props) {
  return (
    <>
      <Campo
        etiqueta="Teléfono"
        type="tel"
        autoComplete="tel"
        placeholder="+54 9 261 555-0100"
        required
        value={valores.telefono}
        onChange={(e) => onCambiar("telefono", e.target.value)}
      />
      <CampoSelect
        etiqueta="Tipo de vehículo"
        placeholder="Elegí una opción"
        opciones={OPCIONES_TIPO_VEHICULO}
        required
        value={valores.tipoVehiculo}
        onChange={(e) => onCambiar("tipoVehiculo", e.target.value as TipoVehiculo)}
      />
      <Campo
        etiqueta="Patente"
        type="text"
        placeholder="AB123CD"
        required
        value={valores.patente}
        onChange={(e) => onCambiar("patente", e.target.value.toUpperCase())}
      />
      <Campo
        etiqueta="Capacidad de carga (kg)"
        type="number"
        min={1}
        required
        value={valores.capacidadCargaKg}
        onChange={(e) => onCambiar("capacidadCargaKg", e.target.value)}
      />
    </>
  );
}
