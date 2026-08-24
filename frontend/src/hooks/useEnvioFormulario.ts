import { useState } from "react";

import { ErrorApi } from "../api/cliente";

export function useEnvioFormulario() {
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(accion: () => Promise<void>, mensajeError: string) {
    setError(null);
    setEnviando(true);
    try {
      await accion();
    } catch (e) {
      setError(e instanceof ErrorApi ? e.message : mensajeError);
    } finally {
      setEnviando(false);
    }
  }

  return { error, enviando, enviar };
}
