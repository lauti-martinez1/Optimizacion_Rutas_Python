import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

import { registrarEmpresa } from "../../api/auth";
import { useEnvioFormulario } from "../../hooks/useEnvioFormulario";
import { useAuthStore } from "../../store/useAuthStore";
import { Boton } from "../ui/Boton";
import { Campo } from "../ui/Campo";
import { Formulario } from "../ui/Formulario";
import { CamposCredenciales } from "./CamposCredenciales";
import { VALORES_CREDENCIALES_INICIALES, validarContrasenasCoinciden } from "./datosRegistro";

export function FormularioRegistroEmpresa() {
  const navigate = useNavigate();
  const establecerUsuario = useAuthStore((estado) => estado.establecerUsuario);
  const { error, enviando, enviar } = useEnvioFormulario();

  const [nombreEmpresa, setNombreEmpresa] = useState("");
  const [credenciales, setCredenciales] = useState(VALORES_CREDENCIALES_INICIALES);

  function manejarSubmit(evento: FormEvent) {
    evento.preventDefault();
    enviar(async () => {
      validarContrasenasCoinciden(credenciales);
      const { usuario } = await registrarEmpresa({
        nombre_empresa: nombreEmpresa,
        email: credenciales.email,
        contrasena: credenciales.contrasena,
        confirmar_contrasena: credenciales.confirmarContrasena,
        nombre_completo: credenciales.nombreCompleto,
      });
      establecerUsuario(usuario);
      navigate("/");
    }, "No se pudo completar el registro.");
  }

  return (
    <Formulario onSubmit={manejarSubmit} error={error}>
      <Campo
        etiqueta="Nombre de la empresa"
        type="text"
        required
        value={nombreEmpresa}
        onChange={(e) => setNombreEmpresa(e.target.value)}
      />
      <CamposCredenciales
        etiquetaNombre="Tu nombre completo"
        valores={credenciales}
        onCambiar={(campo, valor) => setCredenciales((v) => ({ ...v, [campo]: valor }))}
      />
      <Boton type="submit" cargando={enviando}>
        Crear cuenta de empresa
      </Boton>
    </Formulario>
  );
}
