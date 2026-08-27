import { type FormEvent, useEffect, useState } from "react";

import { obtenerChoferesEmpresa } from "../../api/empresa";
import { crearVehiculo, eliminarVehiculo, listarVehiculos } from "../../api/vehiculos";
import { OPCIONES_TIPO_VEHICULO } from "../../componentes/formularios/opcionesVehiculo";
import { Boton } from "../../componentes/ui/Boton";
import { Campo } from "../../componentes/ui/Campo";
import { CampoSelect } from "../../componentes/ui/CampoSelect";
import { Formulario } from "../../componentes/ui/Formulario";
import { TarjetaContenido } from "../../componentes/ui/TarjetaContenido";
import { TextoVacio } from "../../componentes/ui/TextoVacio";
import { useEnvioFormulario } from "../../hooks/useEnvioFormulario";
import type { ChoferResumenEmpresa } from "../../tipos/empresa";
import type { TipoVehiculo, VehiculoPublico } from "../../tipos/vehiculo";

const ETIQUETA_TIPO = Object.fromEntries(
  OPCIONES_TIPO_VEHICULO.map((opcion) => [opcion.valor, opcion.etiqueta]),
);

export function Flota() {
  const [vehiculos, setVehiculos] = useState<VehiculoPublico[]>([]);
  const [choferes, setChoferes] = useState<ChoferResumenEmpresa[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const { error, enviando, enviar } = useEnvioFormulario();

  const [tipoVehiculo, setTipoVehiculo] = useState<TipoVehiculo>("furgon");
  const [patente, setPatente] = useState("");
  const [capacidad, setCapacidad] = useState("");
  const [choferId, setChoferId] = useState("");

  async function recargar() {
    const [vehiculosResp, choferesResp] = await Promise.all([
      listarVehiculos(),
      obtenerChoferesEmpresa(),
    ]);
    setVehiculos(vehiculosResp);
    setChoferes(choferesResp);
  }

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    recargar().finally(() => setCargando(false));
  }, []);

  function nombreChofer(usuarioId: string | null) {
    if (!usuarioId) return "Sin asignar";
    return choferes.find((chofer) => chofer.id === usuarioId)?.nombre_completo ?? "—";
  }

  function manejarSubmit(evento: FormEvent) {
    evento.preventDefault();
    enviar(async () => {
      await crearVehiculo({
        tipo_vehiculo: tipoVehiculo,
        patente,
        capacidad_carga_kg: Number(capacidad),
        usuario_id: choferId || null,
      });
      setPatente("");
      setCapacidad("");
      setChoferId("");
      setMostrarFormulario(false);
      await recargar();
    }, "No se pudo crear el vehículo.");
  }

  async function manejarEliminar(id: string) {
    await eliminarVehiculo(id);
    await recargar();
  }

  if (cargando) {
    return <TextoVacio>Cargando…</TextoVacio>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-texto-fuerte">Flota</h1>
          <p className="text-[12.5px] text-texto-mutado">{vehiculos.length} vehículos</p>
        </div>
        <Boton tamanio="auto" onClick={() => setMostrarFormulario((valor) => !valor)}>
          {mostrarFormulario ? "Cancelar" : "Agregar vehículo"}
        </Boton>
      </div>

      {mostrarFormulario && (
        <TarjetaContenido>
          <Formulario error={error} onSubmit={manejarSubmit}>
            <CampoSelect
              etiqueta="Tipo de vehículo"
              opciones={OPCIONES_TIPO_VEHICULO}
              value={tipoVehiculo}
              onChange={(e) => setTipoVehiculo(e.target.value as TipoVehiculo)}
            />
            <Campo
              etiqueta="Patente"
              required
              value={patente}
              onChange={(e) => setPatente(e.target.value.toUpperCase())}
            />
            <Campo
              etiqueta="Capacidad de carga (kg)"
              type="number"
              min={1}
              required
              value={capacidad}
              onChange={(e) => setCapacidad(e.target.value)}
            />
            <CampoSelect
              etiqueta="Chofer asignado"
              placeholder="Sin asignar (reserva de flota)"
              opciones={choferes.map((chofer) => ({ valor: chofer.id, etiqueta: chofer.nombre_completo }))}
              value={choferId}
              onChange={(e) => setChoferId(e.target.value)}
            />
            <Boton type="submit" cargando={enviando}>
              Guardar vehículo
            </Boton>
          </Formulario>
        </TarjetaContenido>
      )}

      {vehiculos.length === 0 ? (
        <TarjetaContenido>
          <TextoVacio>Todavía no cargaste ningún vehículo.</TextoVacio>
        </TarjetaContenido>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {vehiculos.map((vehiculo) => (
            <li key={vehiculo.id}>
              <TarjetaContenido className="flex items-center justify-between gap-3 px-4 py-3.5">
                <div>
                  <p className="text-[13.5px] font-semibold text-texto-fuerte">{vehiculo.patente}</p>
                  <p className="text-[12px] text-texto-mutado">
                    {ETIQUETA_TIPO[vehiculo.tipo_vehiculo]} · {vehiculo.capacidad_carga_kg} kg ·{" "}
                    {nombreChofer(vehiculo.usuario_id)}
                  </p>
                </div>
                <Boton
                  variante="peligro"
                  tamanio="chica"
                  onClick={() => manejarEliminar(vehiculo.id)}
                >
                  Eliminar
                </Boton>
              </TarjetaContenido>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
