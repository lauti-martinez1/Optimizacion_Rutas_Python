import { useState } from "react";
import { Link } from "react-router-dom";

import { FormularioRegistroChofer } from "../componentes/formularios/FormularioRegistroChofer";
import { FormularioRegistroChoferInvitado } from "../componentes/formularios/FormularioRegistroChoferInvitado";
import { FormularioRegistroEmpresa } from "../componentes/formularios/FormularioRegistroEmpresa";
import { PaginaAuth } from "../componentes/ui/PaginaAuth";

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

  const pie = (
    <>
      ¿Ya tenés cuenta?{" "}
      <Link
        to="/login"
        className="font-semibold text-blanco underline decoration-white/50 underline-offset-2 hover:decoration-white"
      >
        Iniciá sesión
      </Link>
    </>
  );

  if (tipoSeleccionado === null) {
    return (
      <PaginaAuth titulo="Crear cuenta" subtitulo="Elegí el tipo de cuenta que corresponde." pie={pie}>
        <div className="mb-6 flex flex-col gap-2.5">
          {OPCIONES.map((opcion) => (
            <button
              key={opcion.tipo}
              type="button"
              className="flex flex-col gap-0.5 rounded-lg border-[1.5px] border-borde bg-blanco px-4 py-3.5 text-left transition-[border-color,transform] duration-150 hover:-translate-y-px hover:border-primario hover:bg-primario/[0.04] focus-visible:-translate-y-px focus-visible:border-primario focus-visible:bg-primario/[0.04]"
              onClick={() => setTipoSeleccionado(opcion.tipo)}
            >
              <span className="text-[13.5px] font-semibold text-texto-fuerte">{opcion.titulo}</span>
              <span className="text-[11.5px] text-texto-mutado">{opcion.descripcion}</span>
            </button>
          ))}
        </div>
      </PaginaAuth>
    );
  }

  return (
    <PaginaAuth
      antes={
        <button
          type="button"
          className="mb-4 inline-block cursor-pointer border-none bg-transparent p-0 text-[12.5px] text-texto-mutado hover:text-texto-cuerpo"
          onClick={() => setTipoSeleccionado(null)}
        >
          ‹ Elegir otro tipo de cuenta
        </button>
      }
      titulo={OPCIONES.find((o) => o.tipo === tipoSeleccionado)?.titulo ?? ""}
      subtitulo="Completá tus datos para crear la cuenta."
      pie={pie}
    >
      {tipoSeleccionado === "chofer_independiente" && <FormularioRegistroChofer />}
      {tipoSeleccionado === "empresa" && <FormularioRegistroEmpresa />}
      {tipoSeleccionado === "chofer_invitado" && <FormularioRegistroChoferInvitado />}
    </PaginaAuth>
  );
}
