import L from "leaflet";
import "leaflet/dist/leaflet.css";
import marcadorIcono from "leaflet/dist/images/marker-icon.png";
import marcadorIcono2x from "leaflet/dist/images/marker-icon-2x.png";
import marcadorSombra from "leaflet/dist/images/marker-shadow.png";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";

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
  onCambiar: (latitud: number, longitud: number) => void;
}

function ManejadorClicksMapa({ onCambiar }: Pick<Props, "onCambiar">) {
  useMapEvents({
    click(evento) {
      onCambiar(evento.latlng.lat, evento.latlng.lng);
    },
  });
  return null;
}

export function SelectorUbicacion({ latitud, longitud, onCambiar }: Props) {
  const hayUbicacion = latitud != null && longitud != null;
  const centro: [number, number] = hayUbicacion ? [latitud, longitud] : CENTRO_MENDOZA;

  return (
    <div className="campo">
      <span className="campo__etiqueta">Ubicación — tocá el mapa para marcarla</span>
      <div className="selector-ubicacion__mapa">
        <MapContainer center={centro} zoom={hayUbicacion ? 15 : 12} style={{ height: "220px" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {hayUbicacion && <Marker position={[latitud, longitud]} icon={iconoMarcador} />}
          <ManejadorClicksMapa onCambiar={onCambiar} />
        </MapContainer>
      </div>
      {!hayUbicacion && <span className="campo__error">Todavía no marcaste la ubicación.</span>}
    </div>
  );
}
