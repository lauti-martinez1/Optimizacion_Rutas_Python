import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import { MapContainer, Marker, Polyline, TileLayer, useMap } from "react-leaflet";

import { obtenerGeometriaRutaActiva } from "../../api/rutas";
import type { DepositoResumen, ParadaRutaPublica } from "../../tipos/ruta";

const CENTRO_MENDOZA: [number, number] = [-32.8908, -68.8272];

// Marcadores dibujados en CSS (DivIcon), no imágenes — así el color sale de
// los tokens del sistema y sigue el mismo código de estado que las tarjetas.
// La próxima parada (en_curso) se dibuja más grande — comparte el violeta
// del trazo, así que el tamaño (no el color) es lo que la distingue de un
// vistazo sobre el mapa.
function iconoParada(estado: ParadaRutaPublica["estado"]) {
  const tamanio = estado === "en_curso" ? 28 : 20;
  return L.divIcon({
    className: "",
    html: `<div class="marcador-parada marcador-parada--${estado}"></div>`,
    iconSize: [tamanio, tamanio],
    iconAnchor: [tamanio / 2, tamanio / 2],
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

  const proximaParada = paradas.find((parada) => parada.estado === "en_curso");

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
            pathOptions={{ color: "#7C3AED", weight: 3, opacity: 0.55 }}
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
      {proximaParada && (
        <div className="mapa-ruta-activa__proxima">
          <span className="mapa-ruta-activa__punto" />
          <div className="mapa-ruta-activa__proxima-info">
            <p className="mapa-ruta-activa__proxima-nombre">{proximaParada.nombre_snapshot}</p>
            <p className="mapa-ruta-activa__proxima-direccion">
              {proximaParada.direccion_snapshot}
            </p>
          </div>
          <a
            className="mapa-ruta-activa__navegar"
            href={`https://www.google.com/maps/dir/?api=1&destination=${proximaParada.latitud_snapshot},${proximaParada.longitud_snapshot}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Ir con Maps
          </a>
        </div>
      )}
    </div>
  );
}
