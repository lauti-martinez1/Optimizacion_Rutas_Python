import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Boton } from "../ui/Boton";
import { Campo } from "../ui/Campo";
import { useEnvioFormulario } from "../../hooks/useEnvioFormulario";
import { useAuthStore } from "../../store/useAuthStore";

export function FormularioLogin() {
  const navigate = useNavigate();
  const iniciarSesion = useAuthStore((estado) => estado.iniciarSesion);
  const { error, enviando, enviar } = useEnvioFormulario();

  const [email, setEmail] = useState("");
  const [contrasena, setContrasena] = useState("");

  function manejarSubmit(evento: FormEvent) {
    evento.preventDefault();
    enviar(async () => {
      await iniciarSesion(email, contrasena);
      navigate("/");
    }, "No se pudo iniciar sesión.");
  }

  return (
    <form onSubmit={manejarSubmit}>
      {error && <div className="error-formulario">{error}</div>}
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
        autoComplete="current-password"
        required
        value={contrasena}
        onChange={(e) => setContrasena(e.target.value)}
      />
      <Boton type="submit" cargando={enviando}>
        Iniciar sesión
      </Boton>
    </form>
  );
}
