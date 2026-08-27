import { useEffect, useState } from "react";

import { obtenerPedidos } from "../../api/pedidos";
import { ChipEstado } from "../../componentes/ui/ChipEstado";
import { DatoNumerico } from "../../componentes/ui/DatoNumerico";
import { TarjetaContenido } from "../../componentes/ui/TarjetaContenido";
import { TextoVacio } from "../../componentes/ui/TextoVacio";
import type { PedidoPublico } from "../../tipos/pedido";
import type { EstadoParada } from "../../tipos/ruta";

const ETIQUETA_ESTADO_PARADA: Record<EstadoParada, string> = {
  pendiente: "Pendiente",
  en_curso: "En curso",
  completada: "Entregado",
  fallida: "Fallido",
};

const TONO_ESTADO_PARADA: Record<EstadoParada, "neutro" | "exito" | "peligro"> = {
  pendiente: "neutro",
  en_curso: "exito",
  completada: "exito",
  fallida: "peligro",
};

export function Pedidos() {
  const [pedidos, setPedidos] = useState<PedidoPublico[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    obtenerPedidos()
      .then(setPedidos)
      .finally(() => setCargando(false));
  }, []);

  if (cargando) {
    return <TextoVacio>Cargando…</TextoVacio>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-bold text-texto-fuerte">Pedidos</h1>
        <p className="text-[12.5px] text-texto-mutado">{pedidos.length} pedidos programados para hoy</p>
      </div>

      {pedidos.length === 0 ? (
        <TarjetaContenido>
          <TextoVacio>No hay pedidos programados para hoy.</TextoVacio>
        </TarjetaContenido>
      ) : (
        <TarjetaContenido className="overflow-x-auto px-0 py-0">
          <table className="w-full text-left text-[12.5px]">
            <thead>
              <tr className="border-b border-borde text-[11px] font-semibold tracking-[0.02em] text-texto-tenue uppercase">
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Dirección</th>
                <th className="px-4 py-3">Chofer / Vehículo</th>
                <th className="px-4 py-3">Carga</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map((pedido) => (
                <tr key={pedido.id} className="border-b border-borde last:border-0">
                  <td className="px-4 py-3 font-semibold text-texto-fuerte">
                    {pedido.cliente_nombre}
                  </td>
                  <td className="px-4 py-3 text-texto-mutado">{pedido.direccion}</td>
                  <td className="px-4 py-3 text-texto-mutado">
                    {pedido.chofer_nombre} · {pedido.vehiculo_patente}
                  </td>
                  <td className="px-4 py-3">
                    <DatoNumerico>{pedido.carga_kg} kg</DatoNumerico>
                  </td>
                  <td className="px-4 py-3">
                    <ChipEstado
                      etiqueta={ETIQUETA_ESTADO_PARADA[pedido.estado]}
                      tono={TONO_ESTADO_PARADA[pedido.estado]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TarjetaContenido>
      )}
    </div>
  );
}
