import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import { MapContainer, Marker, Polyline, TileLayer, useMap } from "react-leaflet";

import { obtenerGeometriaRutaActiva } from "../../api/rutas";
import type { DepositoResumen, ParadaRutaPublica } from "../../tipos/ruta";

const CENTRO_MENDOZA: [number, number] = [-32.8908, -68.8272];

// Marcadores dibujados en CSS (DivIcon), no imágenes — así el color sale de
// los tokens del sistema y sigue el mismo código de estado que las tarjetas
// (mismo verde que el anillo de "en curso" en la lista y el chip de estado
// de la Ruta). Una vez completada, la parada se saca del mapa por completo
// (ver `paradasVisibles` más abajo) en vez de pintarla — así el mapa se va
// limpiando a medida que avanza el día en lugar de acumular marcas.
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
  const [tramos, setTramos] = useState<[number, number][][]>([]);

  useEffect(() => {
    obtenerGeometriaRutaActiva()
      .then((geometria) => setTramos(geometria.tramos))
      .catch(() => setTramos([]));
  }, []);

  // Una parada completada se saca del mapa (pin y bounds) — ver el comentario
  // sobre iconoParada más arriba.
  const paradasVisibles = paradas.filter((parada) => parada.estado !== "completada");

  const puntosVisibles: [number, number][] = [
    [deposito.latitud, deposito.longitud],
    ...paradasVisibles.map((parada): [number, number] => [
      parada.latitud_snapshot,
      parada.longitud_snapshot,
    ]),
  ];

  // tramos[i] es el tramo que llega a paradas[i] (depósito→paradas[0],
  // paradas[0]→paradas[1], …) — al completar una parada se oculta el tramo
  // que llegaba a ella para ir despejando el trazo violeta, no solo el pin.
  // El último tramo (vuelta al depósito) no tiene parada asociada y queda
  // siempre visible.
  const tramosVisibles = tramos.filter((_, indice) => paradas[indice]?.estado !== "completada");

  const indiceProxima = paradas.findIndex((parada) => parada.estado === "en_curso");
  const proximaParada = indiceProxima === -1 ? undefined : paradas[indiceProxima];
  // De dónde sale la navegación a la próxima parada: del depósito si es la
  // primera del día, o de la parada anterior (ya completada) si no — nunca
  // de la ubicación actual del dispositivo, que puede no ser confiable.
  const origenNavegacion =
    indiceProxima <= 0
      ? { latitud: deposito.latitud, longitud: deposito.longitud }
      : {
          latitud: paradas[indiceProxima - 1].latitud_snapshot,
          longitud: paradas[indiceProxima - 1].longitud_snapshot,
        };

  return (
    <div className="mapa-ruta-activa">
      <MapContainer center={CENTRO_MENDOZA} zoom={13} style={{ height: "280px" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {tramosVisibles.length > 0 && (
          <Polyline
            positions={tramosVisibles}
            pathOptions={{ color: "#7C3AED", weight: 3, opacity: 0.55 }}
          />
        )}
        <Marker position={[deposito.latitud, deposito.longitud]} icon={iconoDeposito} />
        {paradasVisibles.map((parada) => (
          <Marker
            key={parada.id}
            position={[parada.latitud_snapshot, parada.longitud_snapshot]}
            icon={iconoParada(parada.estado)}
          />
        ))}
        <AjustarVista puntos={puntosVisibles} />
      </MapContainer>

      {proximaParada && (
        <a
          className="mapa-ruta-activa__navegar-pill"
          href={`https://www.google.com/maps/dir/?api=1&origin=${origenNavegacion.latitud},${origenNavegacion.longitud}&destination=${proximaParada.latitud_snapshot},${proximaParada.longitud_snapshot}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Ir con Maps
        </a>
      )}

      {proximaParada && (
        <div className="mapa-ruta-activa__proxima">
          <span className="mapa-ruta-activa__punto" />
          <p className="mapa-ruta-activa__proxima-direccion">{proximaParada.direccion_snapshot}</p>
        </div>
      )}
    </div>
  );
}
