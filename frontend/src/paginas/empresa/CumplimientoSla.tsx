import { TarjetaContenido } from "../../componentes/ui/TarjetaContenido";
import { TextoVacio } from "../../componentes/ui/TextoVacio";

export function CumplimientoSla() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-bold text-texto-fuerte">Cumplimiento SLA</h1>
      <TarjetaContenido>
        <TextoVacio>Próximamente — todavía no hay métricas de cumplimiento disponibles.</TextoVacio>
      </TarjetaContenido>
    </div>
  );
}
