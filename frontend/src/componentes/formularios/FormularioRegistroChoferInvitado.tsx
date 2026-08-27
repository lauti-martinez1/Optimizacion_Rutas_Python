import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

import { registrarChoferInvitado } from "../../api/auth";
import { useEnvioFormulario } from "../../hooks/useEnvioFormulario";
import { useAuthStore } from "../../store/useAuthStore";
import type { TipoVehiculo } from "../../tipos/auth";
import { Boton } from "../ui/Boton";
import { Campo } from "../ui/Campo";
import { Formulario } from "../ui/Formulario";
import { CamposCredenciales } from "./CamposCredenciales";
import { CamposVehiculo } from "./CamposVehiculo";
import {
  VALORES_CREDENCIALES_INICIALES,
  VALORES_VEHICULO_INICIALES,
  capacidadCargaValidaKg,
  validarContrasenasCoinciden,
} from "./datosRegistro";

export function FormularioRegistroChoferInvitado() {
  const navigate = useNavigate();
  const establecerUsuario = useAuthStore((estado) => estado.establecerUsuario);
  const { error, enviando, enviar } = useEnvioFormulario();

  const [codigoInvitacion, setCodigoInvitacion] = useState("");
  const [credenciales, setCredenciales] = useState(VALORES_CREDENCIALES_INICIALES);
  const [vehiculo, setVehiculo] = useState(VALORES_VEHICULO_INICIALES);

  function manejarSubmit(evento: FormEvent) {
    evento.preventDefault();
    enviar(async () => {
      validarContrasenasCoinciden(credenciales);
      const usuario = await registrarChoferInvitado({
        email: credenciales.email,
        contrasena: credenciales.contrasena,
        confirmar_contrasena: credenciales.confirmarContrasena,
        nombre_completo: credenciales.nombreCompleto,
        codigo_invitacion: codigoInvitacion.trim().toUpperCase(),
        telefono: vehiculo.telefono,
        tipo_vehiculo: vehiculo.tipoVehiculo as TipoVehiculo,
        patente: vehiculo.patente,
        capacidad_carga_kg: capacidadCargaValidaKg(vehiculo),
      });
      establecerUsuario(usuario);
      navigate("/");
    }, "No se pudo completar el registro.");
  }

  return (
    <Formulario onSubmit={manejarSubmit} error={error}>
      <Campo
        etiqueta="Código de invitación"
        type="text"
        required
        value={codigoInvitacion}
        onChange={(e) => setCodigoInvitacion(e.target.value)}
        placeholder="Lo genera tu empresa"
      />
      <CamposCredenciales
        valores={credenciales}
        onCambiar={(campo, valor) => setCredenciales((v) => ({ ...v, [campo]: valor }))}
      />
      <CamposVehiculo
        valores={vehiculo}
        onCambiar={(campo, valor) => setVehiculo((v) => ({ ...v, [campo]: valor }))}
      />
      <Boton type="submit" cargando={enviando}>
        Unirme a la empresa
      </Boton>
    </Formulario>
  );
}
