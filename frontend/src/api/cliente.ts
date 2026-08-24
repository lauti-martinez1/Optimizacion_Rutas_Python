const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export class ErrorApi extends Error {}

export async function fetchApi<T>(path: string, opciones: RequestInit = {}): Promise<T> {
  const respuesta = await fetch(`${BASE_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...opciones.headers },
    ...opciones,
  });

  if (!respuesta.ok) {
    const cuerpo = await respuesta.json().catch(() => null);
    throw new ErrorApi(cuerpo?.detail ?? "Error de red inesperado.");
  }

  return respuesta.status === 204 ? (undefined as T) : respuesta.json();
}
