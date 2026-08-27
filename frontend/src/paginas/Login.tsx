import { Link } from "react-router-dom";

import { FormularioLogin } from "../componentes/formularios/FormularioLogin";
import { PaginaAuth } from "../componentes/ui/PaginaAuth";

export function Login() {
  return (
    <PaginaAuth
      titulo="Iniciar sesión"
      subtitulo="Entrá con tu email y contraseña."
      pie={
        <>
          ¿No tenés cuenta?{" "}
          <Link
            to="/registro"
            className="font-semibold text-blanco underline decoration-white/50 underline-offset-2 hover:decoration-white"
          >
            Registrate
          </Link>
        </>
      }
    >
      <FormularioLogin />
    </PaginaAuth>
  );
}
