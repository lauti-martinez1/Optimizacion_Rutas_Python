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
//
// El HTML de estos íconos lo consume Leaflet directamente (fuera del árbol
// de React), pero las clases de Tailwind siguen siendo literales completas
// acá abajo — el scanner de Tailwind las encuentra igual, solo la selección
// de cuál usar pasa en runtime, nunca la construcción del string de clases.
const CLASE_MARCADOR: Record<ParadaRutaPublica["estado"], string> = {
  pendiente:
    "h-4 w-4 rounded-full border-[2.5px] border-blanco bg-texto-tenue shadow-[0_1px_4px_rgba(16,24,40,0.4)]",
  en_curso:
    "h-6 w-6 animate-pulso-marcador rounded-full border-[3px] border-blanco bg-exito " +
    "shadow-[0_1px_4px_rgba(16,24,40,0.4)] motion-reduce:animate-none",
  completada:
    "h-4 w-4 rounded-full border-[2.5px] border-blanco bg-exito shadow-[0_1px_4px_rgba(16,24,40,0.4)]",
  fallida:
    "h-4 w-4 rounded-full border-[2.5px] border-blanco bg-peligro shadow-[0_1px_4px_rgba(16,24,40,0.4)]",
};

function iconoParada(estado: ParadaRutaPublica["estado"]) {
  const tamanio = estado === "en_curso" ? 24 : 16;
  return L.divIcon({
    className: "",
    html: `<div class="${CLASE_MARCADOR[estado]}"></div>`,
    iconSize: [tamanio, tamanio],
    iconAnchor: [tamanio / 2, tamanio / 2],
  });
}

const iconoDeposito = L.divIcon({
  className: "",
  html: '<div class="h-[18px] w-[18px] rounded-full border-[2.5px] border-blanco bg-texto-fuerte shadow-[0_1px_4px_rgba(16,24,40,0.45)]"></div>',
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
  // sobre CLASE_MARCADOR más arriba.
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
    <div className="relative overflow-hidden rounded-lg border border-borde bg-superficie-hundida shadow-sm">
      <div className="h-[280px] xl:h-[520px]">
        <MapContainer center={CENTRO_MENDOZA} zoom={13} style={{ height: "100%" }}>
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
      </div>

      {proximaParada && (
        <a
          className="absolute top-3 right-3 z-[500] flex h-[34px] items-center rounded-pill border border-borde bg-[rgba(255,255,255,0.92)] px-[13px] text-[10.5px] font-semibold text-texto-fuerte shadow-sm backdrop-blur-[8px]"
          href={`https://www.google.com/maps/dir/?api=1&origin=${origenNavegacion.latitud},${origenNavegacion.longitud}&destination=${proximaParada.latitud_snapshot},${proximaParada.longitud_snapshot}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Ir con Maps
        </a>
      )}

      {proximaParada && (
        <div className="absolute right-3 bottom-2.5 left-3 z-[500] flex items-center gap-2.5 rounded-md border border-borde bg-[rgba(255,255,255,0.94)] px-3 py-2.5 shadow-md backdrop-blur-[8px]">
          <span className="h-2 w-2 shrink-0 rounded-full bg-exito" />
          <p className="min-w-0 flex-1 truncate text-[11.5px] font-semibold text-texto-fuerte">
            {proximaParada.direccion_snapshot}
          </p>
        </div>
      )}
    </div>
  );
}
