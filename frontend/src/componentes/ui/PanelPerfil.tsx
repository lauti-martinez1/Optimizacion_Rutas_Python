import { OPCIONES_TIPO_VEHICULO } from "../formularios/opcionesVehiculo";
import { useAuthStore } from "../../store/useAuthStore";
import { Boton } from "./Boton";

interface Props {
  abierto: boolean;
  onCerrar: () => void;
  onCerrarSesion: () => void;
}

const ETIQUETA_ROL: Record<string, string> = {
  chofer: "Chofer",
  admin: "Administrador",
};

export function PanelPerfil({ abierto, onCerrar, onCerrarSesion }: Props) {
  const usuario = useAuthStore((estado) => estado.usuario);

  if (!abierto || !usuario) {
    return null;
  }

  const etiquetaVehiculo = usuario.vehiculo
    ? OPCIONES_TIPO_VEHICULO.find((op) => op.valor === usuario.vehiculo?.tipo_vehiculo)?.etiqueta
    : null;

  return (
    <div className="panel-perfil-overlay" onClick={onCerrar}>
      <aside className="panel-perfil" onClick={(e) => e.stopPropagation()}>
        <div className="panel-perfil__cabecera">
          <p className="tarjeta-contenido__titulo">Mi perfil</p>
          <button className="panel-perfil__cerrar" onClick={onCerrar} aria-label="Cerrar">
            ✕
          </button>
        </div>

        <div className="panel-perfil__avatar">
          {usuario.nombre_completo.charAt(0).toUpperCase()}
        </div>
        <p className="panel-perfil__nombre">{usuario.nombre_completo}</p>
        <p className="texto-ayuda">
          {ETIQUETA_ROL[usuario.rol] ?? usuario.rol}
          {usuario.empresa_id ? " · con empresa vinculada" : " · independiente"}
        </p>

        <div className="panel-perfil__seccion">
          <p className="resumen-ruta__eyebrow">Contacto</p>
          <div className="panel-perfil__dato">
            <span className="panel-perfil__dato-etiqueta">Email</span>
            <span className="panel-perfil__dato-valor">{usuario.email}</span>
          </div>
          <div className="panel-perfil__dato">
            <span className="panel-perfil__dato-etiqueta">Teléfono</span>
            <span className="panel-perfil__dato-valor">{usuario.telefono ?? "—"}</span>
          </div>
        </div>

        {usuario.vehiculo && (
          <div className="panel-perfil__seccion">
            <p className="resumen-ruta__eyebrow">Mi vehículo</p>
            <div className="panel-perfil__dato">
              <span className="panel-perfil__dato-etiqueta">Tipo</span>
              <span className="panel-perfil__dato-valor">{etiquetaVehiculo}</span>
            </div>
            <div className="panel-perfil__dato">
              <span className="panel-perfil__dato-etiqueta">Patente</span>
              <span className="panel-perfil__dato-valor">{usuario.vehiculo.patente}</span>
            </div>
            <div className="panel-perfil__dato">
              <span className="panel-perfil__dato-etiqueta">Capacidad</span>
              <span className="panel-perfil__dato-valor">
                {usuario.vehiculo.capacidad_carga_kg} kg
              </span>
            </div>
          </div>
        )}

        <Boton variante="secundario" onClick={onCerrarSesion}>
          Cerrar sesión
        </Boton>
      </aside>
    </div>
  );
}
