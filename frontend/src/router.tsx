import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { LayoutEmpresa } from "./componentes/empresa/LayoutEmpresa";
import { Inicio } from "./paginas/Inicio";
import { Login } from "./paginas/Login";
import { Registro } from "./paginas/Registro";
import { CumplimientoSla } from "./paginas/empresa/CumplimientoSla";
import { Flota } from "./paginas/empresa/Flota";
import { Incidencias } from "./paginas/empresa/Incidencias";
import { Pedidos } from "./paginas/empresa/Pedidos";
import { Reportes } from "./paginas/empresa/Reportes";
import { TorreControl } from "./paginas/empresa/TorreControl";
import { useAuthStore } from "./store/useAuthStore";

function RutaProtegida({ children }: { children: ReactNode }) {
  const estaAutenticado = useAuthStore((estado) => estado.estaAutenticado);
  return estaAutenticado ? <>{children}</> : <Navigate to="/login" replace />;
}

function RutaPublica({ children }: { children: ReactNode }) {
  const estaAutenticado = useAuthStore((estado) => estado.estaAutenticado);
  return estaAutenticado ? <Navigate to="/" replace /> : <>{children}</>;
}

/** Sección "empresa" (Torre de control, Flota, etc.): solo para admins de
 * empresa. Redirige a "/" en vez de a una página de error — un chofer que
 * llega acá (a mano, o con un link viejo) cae en su propia Inicio, que ya
 * está protegida por RutaProtegida más arriba. */
function RutaSoloAdmin({ children }: { children: ReactNode }) {
  const estaAutenticado = useAuthStore((estado) => estado.estaAutenticado);
  const rol = useAuthStore((estado) => estado.usuario?.rol);
  if (!estaAutenticado) {
    return <Navigate to="/login" replace />;
  }
  return rol === "admin" ? <>{children}</> : <Navigate to="/" replace />;
}

/** Landing de "/": un admin de empresa va a su Torre de control, cualquier
 * otro usuario autenticado (chofer, independiente o de empresa) va a su
 * pantalla de siempre. */
function DestinoSegunRol() {
  const rol = useAuthStore((estado) => estado.usuario?.rol);
  return rol === "admin" ? <Navigate to="/empresa" replace /> : <Inicio />;
}

export function AppRouter() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <RutaProtegida>
            <DestinoSegunRol />
          </RutaProtegida>
        }
      />
      <Route
        path="/login"
        element={
          <RutaPublica>
            <Login />
          </RutaPublica>
        }
      />
      <Route
        path="/registro"
        element={
          <RutaPublica>
            <Registro />
          </RutaPublica>
        }
      />
      <Route
        path="/empresa"
        element={
          <RutaSoloAdmin>
            <LayoutEmpresa />
          </RutaSoloAdmin>
        }
      >
        <Route index element={<TorreControl />} />
        <Route path="pedidos" element={<Pedidos />} />
        <Route path="flota" element={<Flota />} />
        <Route path="incidencias" element={<Incidencias />} />
        <Route path="reportes" element={<Reportes />} />
        <Route path="sla" element={<CumplimientoSla />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
