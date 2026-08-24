import { Link } from "react-router-dom";

import { FormularioLogin } from "../componentes/formularios/FormularioLogin";

export function Login() {
  return (
    <div className="pagina-auth">
      <div className="tarjeta-auth">
        <h1 className="tarjeta-auth__titulo">Iniciar sesión</h1>
        <p className="tarjeta-auth__subtitulo">Entrá con tu email y contraseña.</p>
        <FormularioLogin />
      </div>
      <p className="pie-auth">
        ¿No tenés cuenta? <Link to="/registro">Registrate</Link>
      </p>
    </div>
  );
}
