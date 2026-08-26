import { useEffect, useState } from "react";

import { obtenerRutaActiva } from "../api/rutas";
import type { RutaPublica } from "../tipos/ruta";

const ETIQUETA_ESTADO: Record<RutaPublica["estado"], string> = {
  planificada: "Planificada",
  en_curso: "En curso",
  completada: "Completada",
  cancelada: "Cancelada",
};

export function PestanaInicio() {
  const [ruta, setRuta] = useState<RutaPublica | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    obtenerRutaActiva()
      .then(setRuta)
      .finally(() => setCargando(false));
  }, []);

  if (cargando) {
    return <p className="texto-vacio">Cargando…</p>;
  }

  if (!ruta) {
    return (
      <div className="tarjeta-contenido">
        <p>Todavía no tenés rutas asignadas.</p>
      </div>
    );
  }

  return (
    <div className="pestana-lugares">
      <div className="tarjeta-contenido">
        <p className="tarjeta-contenido__titulo">
          Ruta de hoy — {ETIQUETA_ESTADO[ruta.estado]}
        </p>
        <p className="dato-numerico">
          {ruta.paradas.length} paradas
          {ruta.distancia_total_m != null && ` · ${(ruta.distancia_total_m / 1000).toFixed(1)} km`}
        </p>
      </div>
      <ol className="lista-lugares">
        {ruta.paradas.map((parada) => (
          <li key={parada.id} className="tarjeta-lugar">
            <div className="tarjeta-lugar__info">
              <p className="tarjeta-lugar__nombre">
                {parada.orden + 1}. {parada.nombre_snapshot}
              </p>
              <p className="tarjeta-lugar__direccion">{parada.direccion_snapshot}</p>
            </div>
            <span className="dato-numerico">{parada.demanda_carga_snapshot} kg</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
