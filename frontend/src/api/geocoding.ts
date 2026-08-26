import { fetchApi } from "./cliente";

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
