import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

import { registrarChoferInvitado } from "../../api/auth";
import { useEnvioFormulario } from "../../hooks/useEnvioFormulario";
import { useAuthStore } from "../../store/useAuthStore";
import { Boton } from "../ui/Boton";
import { Campo } from "../ui/Campo";

export function FormularioRegistroChoferInvitado() {
  const navigate = useNavigate();
  const establecerUsuario = useAuthStore((estado) => estado.establecerUsuario);
  const { error, enviando, enviar } = useEnvioFormulario();

  const [codigoInvitacion, setCodigoInvitacion] = useState("");
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [email, setEmail] = useState("");
  const [contrasena, setContrasena] = useState("");

  function manejarSubmit(evento: FormEvent) {
    evento.preventDefault();
    enviar(async () => {
      const usuario = await registrarChoferInvitado({
        email,
        contrasena,
        nombre_completo: nombreCompleto,
        codigo_invitacion: codigoInvitacion.trim().toUpperCase(),
      });
      establecerUsuario(usuario);
      navigate("/");
    }, "No se pudo completar el registro.");
  }

  return (
    <form onSubmit={manejarSubmit}>
      {error && <div className="error-formulario">{error}</div>}
      <Campo
        etiqueta="Código de invitación"
        type="text"
        required
        value={codigoInvitacion}
        onChange={(e) => setCodigoInvitacion(e.target.value)}
        placeholder="Lo genera tu empresa"
      />
      <Campo
        etiqueta="Nombre completo"
        type="text"
        required
        value={nombreCompleto}
        onChange={(e) => setNombreCompleto(e.target.value)}
      />
      <Campo
        etiqueta="Email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Campo
        etiqueta="Contraseña"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
        value={contrasena}
        onChange={(e) => setContrasena(e.target.value)}
      />
      <Boton type="submit" cargando={enviando}>
        Unirme a la empresa
      </Boton>
    </form>
  );
}
