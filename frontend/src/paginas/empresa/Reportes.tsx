import { TarjetaContenido } from "../../componentes/ui/TarjetaContenido";
import { TextoVacio } from "../../componentes/ui/TextoVacio";

export function Reportes() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-bold text-texto-fuerte">Reportes</h1>
      <TarjetaContenido>
        <TextoVacio>Próximamente — todavía no hay reportes agregados disponibles.</TextoVacio>
      </TarjetaContenido>
    </div>
  );
}
