import { fetchApi } from "./cliente";

export interface ResultadoBusquedaDireccion {
  direccion: string;
  latitud: number;
  longitud: number;
}

export async function geocodificarInverso(
  latitud: number,
  longitud: number,
): Promise<string | null> {
  try {
    const resultado = await fetchApi<{ direccion: string | null }>(
      `/api/v1/geocoding/inverso?latitud=${latitud}&longitud=${longitud}`,
    );
    return resultado.direccion;
  } catch {
    // Autocompletado best-effort: si Nominatim falla o tarda, el chofer
    // sigue pudiendo escribir la dirección a mano.
    return null;
  }
}

export async function buscarDireccion(query: string): Promise<ResultadoBusquedaDireccion[]> {
  try {
    return await fetchApi<ResultadoBusquedaDireccion[]>(
      `/api/v1/geocoding/buscar?q=${encodeURIComponent(query)}`,
    );
  } catch {
    // Mismo criterio best-effort que geocodificarInverso: si Nominatim
    // falla, el buscador simplemente no sugiere nada — el chofer sigue
    // pudiendo marcar en el mapa a mano.
    return [];
  }
}
