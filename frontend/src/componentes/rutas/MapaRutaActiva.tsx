import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import { MapContainer, Marker, Polyline, TileLayer, useMap } from "react-leaflet";

import { obtenerGeometriaRutaActiva } from "../../api/rutas";
import type { DepositoResumen, ParadaRutaPublica } from "../../tipos/ruta";

const CENTRO_MENDOZA: [number, number] = [-32.8908, -68.8272];

// Marcadores dibujados en CSS (DivIcon), no imágenes — así el color sale de
// los tokens del sistema y sigue el mismo código de estado que las tarjetas.
function iconoParada(estado: ParadaRutaPublica["estado"]) {
  return L.divIcon({
    className: "",
    html: `<div class="marcador-parada marcador-parada--${estado}"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

const iconoDeposito = L.divIcon({
  className: "",
  html: '<div class="marcador-deposito"></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

function AjustarVista({ puntos }: { puntos: [number, number][] }) {
  const mapa = useMap();
  useEffect(() => {
    if (puntos.length > 0) {
      mapa.fitBounds(puntos, { padding: [28, 28] });
    }
  }, [mapa, puntos]);
  return null;
}

interface Props {
  deposito: DepositoResumen;
  paradas: ParadaRutaPublica[];
}

export function MapaRutaActiva({ deposito, paradas }: Props) {
  const [puntosCamino, setPuntosCamino] = useState<[number, number][]>([]);

  useEffect(() => {
    obtenerGeometriaRutaActiva()
      .then((geometria) => setPuntosCamino(geometria.puntos))
      .catch(() => setPuntosCamino([]));
  }, []);

  const puntosVisibles: [number, number][] = [
    [deposito.latitud, deposito.longitud],
    ...paradas.map((parada): [number, number] => [parada.latitud_snapshot, parada.longitud_snapshot]),
  ];

  return (
    <div className="mapa-ruta-activa">
      <MapContainer center={CENTRO_MENDOZA} zoom={13} style={{ height: "260px" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {puntosCamino.length > 0 && (
          <Polyline
            positions={puntosCamino}
            pathOptions={{ color: "#2E5CFF", weight: 4, opacity: 0.75 }}
          />
        )}
        <Marker position={[deposito.latitud, deposito.longitud]} icon={iconoDeposito} />
        {paradas.map((parada) => (
          <Marker
            key={parada.id}
            position={[parada.latitud_snapshot, parada.longitud_snapshot]}
            icon={iconoParada(parada.estado)}
          />
        ))}
        <AjustarVista puntos={puntosVisibles} />
      </MapContainer>
    </div>
  );
}
