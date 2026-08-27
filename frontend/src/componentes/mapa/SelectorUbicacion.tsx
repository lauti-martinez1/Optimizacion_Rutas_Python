import L from "leaflet";
import "leaflet/dist/leaflet.css";
import marcadorIcono from "leaflet/dist/images/marker-icon.png";
import marcadorIcono2x from "leaflet/dist/images/marker-icon-2x.png";
import marcadorSombra from "leaflet/dist/images/marker-shadow.png";
import { useState } from "react";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";

import { geocodificarInverso } from "../../api/geocoding";
import { CampoContenedor } from "../ui/CampoContenedor";

// El bundler no resuelve las rutas relativas que Leaflet usa por defecto
// para el ícono del pin — hay que apuntarlas a mano a los assets importados.
const iconoMarcador = L.icon({
  iconUrl: marcadorIcono,
  iconRetinaUrl: marcadorIcono2x,
  shadowUrl: marcadorSombra,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Centro del Gran Mendoza — punto de partida del mapa cuando todavía no hay
// ninguna ubicación marcada.
const CENTRO_MENDOZA: [number, number] = [-32.8908, -68.8272];

interface Props {
  latitud: number | null;
  longitud: number | null;
  /** direccionSugerida llega en null en el momento del click (todavía no se
   * resolvió) y de nuevo con el resultado de Nominatim cuando está listo —
   * o null si no encontró nada. El caller decide si pisa su campo de texto. */
  onCambiar: (latitud: number, longitud: number, direccionSugerida: string | null) => void;
}

function ManejadorClicksMapa({ onClick }: { onClick: (lat: number, lon: number) => void }) {
  useMapEvents({
    click(evento) {
      onClick(evento.latlng.lat, evento.latlng.lng);
    },
  });
  return null;
}

export function SelectorUbicacion({ latitud, longitud, onCambiar }: Props) {
  const [buscando, setBuscando] = useState(false);
  const [direccionResuelta, setDireccionResuelta] = useState<string | null>(null);
  const hayUbicacion = latitud != null && longitud != null;
  const centro: [number, number] = hayUbicacion ? [latitud, longitud] : CENTRO_MENDOZA;

  function manejarClickMapa(lat: number, lon: number) {
    onCambiar(lat, lon, null);
    setDireccionResuelta(null);
    setBuscando(true);
    geocodificarInverso(lat, lon).then((direccion) => {
      setBuscando(false);
      setDireccionResuelta(direccion);
      onCambiar(lat, lon, direccion);
    });
  }

  return (
    <CampoContenedor etiqueta="Ubicación — tocá el mapa para marcarla">
      <div className="overflow-hidden rounded-md border border-borde-input">
        <MapContainer center={centro} zoom={hayUbicacion ? 15 : 12} style={{ height: "220px" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {hayUbicacion && <Marker position={[latitud, longitud]} icon={iconoMarcador} />}
          <ManejadorClicksMapa onClick={manejarClickMapa} />
        </MapContainer>
      </div>
      {buscando && <span className="mt-1.5 block text-xs text-texto-mutado">Buscando dirección…</span>}
      {!buscando && direccionResuelta && (
        <span className="mt-1.5 block text-xs text-texto-mutado">{direccionResuelta}</span>
      )}
      {!hayUbicacion && !buscando && (
        <span className="text-[11.5px] text-peligro">Todavía no marcaste la ubicación.</span>
      )}
    </CampoContenedor>
  );
}
