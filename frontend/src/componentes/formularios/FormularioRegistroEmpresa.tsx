import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

import { registrarEmpresa } from "../../api/auth";
import { useEnvioFormulario } from "../../hooks/useEnvioFormulario";
import { useAuthStore } from "../../store/useAuthStore";
import { Boton } from "../ui/Boton";
import { Campo } from "../ui/Campo";

export function FormularioRegistroEmpresa() {
  const navigate = useNavigate();
  const establecerUsuario = useAuthStore((estado) => estado.establecerUsuario);
  const { error, enviando, enviar } = useEnvioFormulario();

  const [nombreEmpresa, setNombreEmpresa] = useState("");
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [email, setEmail] = useState("");
  const [contrasena, setContrasena] = useState("");

  function manejarSubmit(evento: FormEvent) {
    evento.preventDefault();
    enviar(async () => {
      const { usuario } = await registrarEmpresa({
        nombre_empresa: nombreEmpresa,
        email,
        contrasena,
        nombre_completo: nombreCompleto,
      });
      establecerUsuario(usuario);
      navigate("/");
    }, "No se pudo completar el registro.");
  }

  return (
    <form onSubmit={manejarSubmit}>
      {error && <div className="error-formulario">{error}</div>}
      <Campo
        etiqueta="Nombre de la empresa"
        type="text"
        required
        value={nombreEmpresa}
        onChange={(e) => setNombreEmpresa(e.target.value)}
      />
      <Campo
        etiqueta="Tu nombre completo"
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
        Crear cuenta de empresa
      </Boton>
    </form>
  );
}
