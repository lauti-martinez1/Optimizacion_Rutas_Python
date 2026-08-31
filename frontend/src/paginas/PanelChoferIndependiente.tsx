import { EscritorioChofer } from "../componentes/escritorio/EscritorioChofer";
import type { UsuarioPublico } from "../tipos/auth";

interface Props {
  usuario: UsuarioPublico;
  onLogout: () => void;
}

/** Pantalla del chofer independiente: EscritorioChofer es responsive y
 * cubre mobile/tablet/escritorio con el mismo shell (sidebar violeta que
 * se acuesta en una barra + nav horizontal en pantallas chicas) — una sola
 * experiencia, no dos diseños en paralelo. "Mi cuenta" vive como una
 * sección más del menú (ver EscritorioChofer/PanelCuenta), no como un
 * drawer aparte. */
export function PanelChoferIndependiente({ usuario, onLogout }: Props) {
  return <EscritorioChofer usuario={usuario} onLogout={onLogout} />;
}
