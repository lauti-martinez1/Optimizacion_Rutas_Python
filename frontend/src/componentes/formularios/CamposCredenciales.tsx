import { Campo } from "../ui/Campo";
import type { ValoresCredenciales } from "./datosRegistro";

interface Props {
  valores: ValoresCredenciales;
  onCambiar: <K extends keyof ValoresCredenciales>(campo: K, valor: ValoresCredenciales[K]) => void;
  etiquetaNombre?: string;
}

export function CamposCredenciales({
  valores,
  onCambiar,
  etiquetaNombre = "Nombre completo",
}: Props) {
  return (
    <>
      <Campo
        etiqueta={etiquetaNombre}
        type="text"
        required
        value={valores.nombreCompleto}
        onChange={(e) => onCambiar("nombreCompleto", e.target.value)}
      />
      <Campo
        etiqueta="Email"
        type="email"
        autoComplete="email"
        required
        value={valores.email}
        onChange={(e) => onCambiar("email", e.target.value)}
      />
      <Campo
        etiqueta="Contraseña"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
        value={valores.contrasena}
        onChange={(e) => onCambiar("contrasena", e.target.value)}
      />
      <Campo
        etiqueta="Confirmar contraseña"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
        value={valores.confirmarContrasena}
        onChange={(e) => onCambiar("confirmarContrasena", e.target.value)}
      />
    </>
  );
}
