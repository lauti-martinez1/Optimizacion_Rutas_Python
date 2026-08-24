const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

/** Error con mensaje seguro para mostrar en un formulario, ya sea que venga
 * del backend (detail de una respuesta no-2xx) o de una validación de cliente. */
export class ErrorFormulario extends Error {}

export async function fetchApi<T>(path: string, opciones: RequestInit = {}): Promise<T> {
  const respuesta = await fetch(`${BASE_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...opciones.headers },
    ...opciones,
  });

  if (!respuesta.ok) {
    const cuerpo = await respuesta.json().catch(() => null);
    throw new ErrorFormulario(cuerpo?.detail ?? "Error de red inesperado.");
  }

  return respuesta.status === 204 ? (undefined as T) : respuesta.json();
}
