import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import { MapContainer, Marker, Polyline, TileLayer, useMap } from "react-leaflet";

import { obtenerGeometriaRutaEmpresa } from "../../api/empresa";
import type { RutaResumenEmpresa } from "../../tipos/empresa";
import type { RutaPublica } from "../../tipos/ruta";

const CENTRO_MENDOZA: [number, number] = [-32.8908, -68.8272];

// Mismo código de color que MapaRutaActiva (violeta planificada, verde en
// curso), sumando rojo para riesgo — no hay tracking GPS por chofer, así que
// cada ruta se representa por el pin de su depósito, no por una posición en
// tiempo real. Si varias rutas comparten depósito (lo más común: una sola
// base para toda la empresa) sus pines quedan superpuestos — limitación
// conocida de esta primera versión, la tabla sigue siendo la forma confiable
// de elegir una ruta puntual.
function colorRuta(ruta: RutaResumenEmpresa): string {
  if (ruta.en_riesgo) return "#F04438";
  if (ruta.estado === "en_curso") return "#12B76A";
  return "#7C3AED";
}

function iconoDeposito(color: string, seleccionado: boolean) {
  const tamanio = seleccionado ? 22 : 14;
  return L.divIcon({
    className: "",
    html: `<div style="width:${tamanio}px;height:${tamanio}px;border-radius:9999px;border:2.5px solid #fff;background:${color};box-shadow:0 1px 4px rgba(16,24,40,0.4)"></div>`,
    iconSize: [tamanio, tamanio],
    iconAnchor: [tamanio / 2, tamanio / 2],
  });
}

const iconoParada = L.divIcon({
  className: "",
  html: '<div class="h-3.5 w-3.5 rounded-full border-2 border-blanco bg-texto-fuerte shadow-[0_1px_4px_rgba(16,24,40,0.4)]"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

function AjustarVista({ puntos }: { puntos: [number, number][] }) {
  const mapa = useMap();
  useEffect(() => {
    if (puntos.length > 0) {
      mapa.fitBounds(puntos, { padding: [32, 32] });
    }
  }, [mapa, puntos]);
  return null;
}

interface Props {
  rutas: RutaResumenEmpresa[];
  rutaSeleccionada: RutaPublica | null;
  idSeleccionado: string | null;
  onSeleccionar: (id: string) => void;
}

export function MapaTorreControl({ rutas, rutaSeleccionada, idSeleccionado, onSeleccionar }: Props) {
  const [tramos, setTramos] = useState<[number, number][][]>([]);

  useEffect(() => {
    if (!idSeleccionado) {
      // oxlint-disable-next-line react/set-state-in-effect
      setTramos([]);
      return;
    }
    obtenerGeometriaRutaEmpresa(idSeleccionado)
      .then((geometria) => setTramos(geometria.tramos))
      .catch(() => setTramos([]));
  }, [idSeleccionado]);

  const puntos: [number, number][] = [
    ...rutas.map((ruta): [number, number] => [ruta.deposito.latitud, ruta.deposito.longitud]),
    ...(rutaSeleccionada?.paradas.map((p): [number, number] => [
      p.latitud_snapshot,
      p.longitud_snapshot,
    ]) ?? []),
  ];

  return (
    <div className="overflow-hidden rounded-lg border border-borde bg-superficie-hundida shadow-sm">
      <div className="h-[420px]">
        <MapContainer center={CENTRO_MENDOZA} zoom={12} style={{ height: "100%" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {tramos.map((tramo, indice) => (
            <Polyline
              key={indice}
              positions={tramo}
              pathOptions={{ color: "#7C3AED", weight: 4, opacity: 0.75 }}
            />
          ))}
          {rutas.map((ruta) => (
            <Marker
              key={ruta.id}
              position={[ruta.deposito.latitud, ruta.deposito.longitud]}
              icon={iconoDeposito(colorRuta(ruta), ruta.id === idSeleccionado)}
              eventHandlers={{ click: () => onSeleccionar(ruta.id) }}
            />
          ))}
          {rutaSeleccionada?.paradas.map((parada) => (
            <Marker
              key={parada.id}
              position={[parada.latitud_snapshot, parada.longitud_snapshot]}
              icon={iconoParada}
            />
          ))}
          {puntos.length > 0 && <AjustarVista puntos={puntos} />}
        </MapContainer>
      </div>
    </div>
  );
}
