import { useNavigate } from "react-router-dom";

import { Boton } from "../componentes/ui/Boton";
import { useAuthStore } from "../store/useAuthStore";

export function Inicio() {
  const navigate = useNavigate();
  const usuario = useAuthStore((estado) => estado.usuario);
  const cerrarSesion = useAuthStore((estado) => estado.cerrarSesion);

  async function manejarLogout() {
    await cerrarSesion();
    navigate("/login");
  }

  return (
    <div className="pagina-auth">
      <div className="tarjeta-auth">
        <h1 className="tarjeta-auth__titulo">Hola, {usuario?.nombre_completo}</h1>
        <p className="tarjeta-auth__subtitulo">
          Rol: {usuario?.rol === "admin" ? "Administrador de empresa" : "Chofer"}
          {usuario?.empresa_id ? " · con empresa vinculada" : usuario?.rol === "chofer" ? " · independiente" : ""}
        </p>
        <Boton variante="secundario" onClick={manejarLogout}>
          Cerrar sesión
        </Boton>
      </div>
    </div>
  );
}
