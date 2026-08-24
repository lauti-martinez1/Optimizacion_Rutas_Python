import { useState } from "react";
import { Link } from "react-router-dom";

import { FormularioRegistroChofer } from "../componentes/formularios/FormularioRegistroChofer";
import { FormularioRegistroChoferInvitado } from "../componentes/formularios/FormularioRegistroChoferInvitado";
import { FormularioRegistroEmpresa } from "../componentes/formularios/FormularioRegistroEmpresa";

type TipoCuenta = "chofer_independiente" | "empresa" | "chofer_invitado";

const OPCIONES: { tipo: TipoCuenta; titulo: string; descripcion: string }[] = [
  {
    tipo: "chofer_independiente",
    titulo: "Soy chofer independiente",
    descripcion: "Armás y gestionás tus propias rutas de entrega.",
  },
  {
    tipo: "empresa",
    titulo: "Soy una empresa",
    descripcion: "Vas a poder invitar choferes y asignarles rutas.",
  },
  {
    tipo: "chofer_invitado",
    titulo: "Tengo un código de invitación",
    descripcion: "Me invitó una empresa para sumarme a su flota.",
  },
];

export function Registro() {
  const [tipoSeleccionado, setTipoSeleccionado] = useState<TipoCuenta | null>(null);

  return (
    <div className="pagina-auth">
      <div className="tarjeta-auth">
        {tipoSeleccionado === null ? (
          <>
            <h1 className="tarjeta-auth__titulo">Crear cuenta</h1>
            <p className="tarjeta-auth__subtitulo">Elegí el tipo de cuenta que corresponde.</p>
            <div className="selector-tipo-cuenta">
              {OPCIONES.map((opcion) => (
                <button
                  key={opcion.tipo}
                  type="button"
                  className="selector-tipo-cuenta__opcion"
                  onClick={() => setTipoSeleccionado(opcion.tipo)}
                >
                  <span className="selector-tipo-cuenta__titulo">{opcion.titulo}</span>
                  <span className="selector-tipo-cuenta__descripcion">{opcion.descripcion}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <span className="enlace-volver" onClick={() => setTipoSeleccionado(null)}>
              ‹ Elegir otro tipo de cuenta
            </span>
            <h1 className="tarjeta-auth__titulo">
              {OPCIONES.find((o) => o.tipo === tipoSeleccionado)?.titulo}
            </h1>
            <p className="tarjeta-auth__subtitulo">Completá tus datos para crear la cuenta.</p>
            {tipoSeleccionado === "chofer_independiente" && <FormularioRegistroChofer />}
            {tipoSeleccionado === "empresa" && <FormularioRegistroEmpresa />}
            {tipoSeleccionado === "chofer_invitado" && <FormularioRegistroChoferInvitado />}
          </>
        )}
      </div>
      <p className="pie-auth">
        ¿Ya tenés cuenta? <Link to="/login">Iniciá sesión</Link>
      </p>
    </div>
  );
}
