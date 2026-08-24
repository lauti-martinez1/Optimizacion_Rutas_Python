import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";

import { AppRouter } from "./router";
import { useAuthStore } from "./store/useAuthStore";

export default function App() {
  const cargarSesion = useAuthStore((estado) => estado.cargarSesion);
  const cargando = useAuthStore((estado) => estado.cargando);

  useEffect(() => {
    cargarSesion();
  }, [cargarSesion]);

  if (cargando) {
    return null;
  }

  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  );
}
