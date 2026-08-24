import { create } from "zustand";

import { cerrarSesion as apiCerrarSesion, iniciarSesion as apiIniciarSesion, obtenerUsuarioActual } from "../api/auth";
import type { UsuarioPublico } from "../tipos/auth";

interface EstadoAuth {
  usuario: UsuarioPublico | null;
  cargando: boolean;
  estaAutenticado: boolean;
  cargarSesion: () => Promise<void>;
  iniciarSesion: (email: string, contrasena: string) => Promise<void>;
  cerrarSesion: () => Promise<void>;
  establecerUsuario: (usuario: UsuarioPublico) => void;
}

// Sin middleware `persist`: la sesión SIEMPRE se re-hidrata desde el backend
// (cookie httpOnly + GET /me), nunca desde localStorage.
export const useAuthStore = create<EstadoAuth>((set) => ({
  usuario: null,
  cargando: true,
  estaAutenticado: false,

  cargarSesion: async () => {
    try {
      const usuario = await obtenerUsuarioActual();
      set({ usuario, estaAutenticado: true, cargando: false });
    } catch {
      set({ usuario: null, estaAutenticado: false, cargando: false });
    }
  },

  iniciarSesion: async (email, contrasena) => {
    const usuario = await apiIniciarSesion({ email, contrasena });
    set({ usuario, estaAutenticado: true });
  },

  cerrarSesion: async () => {
    await apiCerrarSesion();
    set({ usuario: null, estaAutenticado: false });
  },

  establecerUsuario: (usuario) => set({ usuario, estaAutenticado: true }),
}));
