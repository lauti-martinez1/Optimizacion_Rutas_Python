from tests.conftest import crear_empresa_con_chofer, payload_chofer

BASE = "/api/v1/vehiculos"

PAYLOAD_VEHICULO = {
    "tipo_vehiculo": "camion",
    "patente": "AA111BB",
    "capacidad_carga_kg": 1000,
}


def test_admin_crea_y_lista_vehiculo(client):
    crear_empresa_con_chofer(client)

    respuesta = client.post(BASE, json=PAYLOAD_VEHICULO)
    assert respuesta.status_code == 201
    cuerpo = respuesta.json()
    assert cuerpo["patente"] == "AA111BB"
    assert cuerpo["activo"] is True
    assert cuerpo["usuario_id"] is None

    listado = client.get(BASE)
    assert listado.status_code == 200
    # El vehículo del chofer invitado (creado al registrarse) + el nuevo de reserva.
    assert len(listado.json()) == 2


def test_no_admin_no_puede_crear_vehiculo(client):
    respuesta = client.post(
        "/api/v1/auth/registro/chofer-independiente", json=payload_chofer("chofer-solo@test.com")
    )
    assert respuesta.status_code == 201

    respuesta = client.post(BASE, json=PAYLOAD_VEHICULO)
    assert respuesta.status_code == 403


def test_crear_vehiculo_asignado_a_chofer_ajeno_da_404(client):
    _, chofer_ajeno = crear_empresa_con_chofer(
        client,
        email_admin="admin1@test.com",
        email_chofer="chofer1@test.com",
        patente_chofer="XX111XX",
    )
    client.cookies.clear()

    crear_empresa_con_chofer(
        client,
        email_admin="admin2@test.com",
        email_chofer="chofer2@test.com",
        patente_chofer="ZZ222ZZ",
    )
    respuesta = client.post(BASE, json={**PAYLOAD_VEHICULO, "usuario_id": chofer_ajeno["id"]})
    assert respuesta.status_code == 404


def test_patente_duplicada_da_409(client):
    crear_empresa_con_chofer(client)
    client.post(BASE, json=PAYLOAD_VEHICULO)

    respuesta = client.post(BASE, json=PAYLOAD_VEHICULO)
    assert respuesta.status_code == 409


def test_actualizar_y_eliminar_vehiculo(client):
    crear_empresa_con_chofer(client)
    creado = client.post(BASE, json=PAYLOAD_VEHICULO).json()

    actualizado = client.patch(f"{BASE}/{creado['id']}", json={"capacidad_carga_kg": 1500})
    assert actualizado.status_code == 200
    assert actualizado.json()["capacidad_carga_kg"] == 1500

    eliminado = client.delete(f"{BASE}/{creado['id']}")
    assert eliminado.status_code == 200
    patentes = [v["patente"] for v in client.get(BASE).json()]
    assert PAYLOAD_VEHICULO["patente"] not in patentes


def test_vehiculo_no_visible_ni_editable_para_otra_empresa(client):
    crear_empresa_con_chofer(client)
    creado = client.post(BASE, json=PAYLOAD_VEHICULO).json()
    client.cookies.clear()

    crear_empresa_con_chofer(
        client,
        email_admin="admin2@test.com",
        email_chofer="chofer2@test.com",
        patente_chofer="ZZ222ZZ",
    )
    patentes = [v["patente"] for v in client.get(BASE).json()]
    assert PAYLOAD_VEHICULO["patente"] not in patentes

    respuesta = client.patch(f"{BASE}/{creado['id']}", json={"capacidad_carga_kg": 1})
    assert respuesta.status_code == 404
