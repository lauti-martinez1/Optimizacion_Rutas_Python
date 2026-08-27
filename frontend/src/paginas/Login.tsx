import { Link } from "react-router-dom";

import { FormularioLogin } from "../componentes/formularios/FormularioLogin";
import { PaginaAuth, claseEnlacePie } from "../componentes/ui/PaginaAuth";

export function Login() {
  return (
    <PaginaAuth
      titulo="Iniciar sesión"
      subtitulo="Entrá con tu email y contraseña."
      pie={
        <>
          ¿No tenés cuenta?{" "}
          <Link to="/registro" className={claseEnlacePie}>
            Registrate
          </Link>
        </>
      }
    >
      <FormularioLogin />
    </PaginaAuth>
  );
}
