from tests.conftest import payload_chofer

BASE = "/api/v1/clientes"

PAYLOAD_CLIENTE = {
    "nombre": "Kiosco Don José",
    "direccion": "San Martín 123, Mendoza",
    "latitud": -32.8908,
    "longitud": -68.8272,
    "telefono": "+54 9 261 555-1234",
}


def _registrar_chofer_independiente(client, email="chofer@test.com", patente="AB123CD"):
    return client.post(
        "/api/v1/auth/registro/chofer-independiente",
        json=payload_chofer(email, patente=patente),
    )


def test_crear_y_listar_cliente(client):
    _registrar_chofer_independiente(client)

    respuesta = client.post(BASE, json=PAYLOAD_CLIENTE)
    assert respuesta.status_code == 201
    cuerpo = respuesta.json()
    assert cuerpo["nombre"] == "Kiosco Don José"
    assert cuerpo["activo"] is True

    listado = client.get(BASE)
    assert listado.status_code == 200
    assert len(listado.json()) == 1
    assert listado.json()[0]["direccion"] == "San Martín 123, Mendoza"


def test_crear_cliente_sin_sesion_da_401(client):
    respuesta = client.post(BASE, json=PAYLOAD_CLIENTE)
    assert respuesta.status_code == 401


def test_actualizar_cliente(client):
    _registrar_chofer_independiente(client)
    creado = client.post(BASE, json=PAYLOAD_CLIENTE).json()

    respuesta = client.patch(f"{BASE}/{creado['id']}", json={"nombre": "Kiosco Renombrado"})
    assert respuesta.status_code == 200
    cuerpo = respuesta.json()
    assert cuerpo["nombre"] == "Kiosco Renombrado"
    # Los campos no enviados no se tocan.
    assert cuerpo["direccion"] == PAYLOAD_CLIENTE["direccion"]


def test_eliminar_cliente_es_soft_delete_y_desaparece_del_listado(client):
    _registrar_chofer_independiente(client)
    creado = client.post(BASE, json=PAYLOAD_CLIENTE).json()

    respuesta = client.delete(f"{BASE}/{creado['id']}")
    assert respuesta.status_code == 200

    assert client.get(BASE).json() == []


def test_cliente_no_visible_ni_editable_para_otro_chofer(client):
    _registrar_chofer_independiente(client, email="chofer1@test.com", patente="AB123CD")
    creado = client.post(BASE, json=PAYLOAD_CLIENTE).json()
    client.cookies.clear()

    _registrar_chofer_independiente(client, email="chofer2@test.com", patente="ZZ999XX")
    assert client.get(BASE).json() == []

    respuesta = client.patch(f"{BASE}/{creado['id']}", json={"nombre": "Intento ajeno"})
    assert respuesta.status_code == 404


def test_choferes_de_la_misma_empresa_comparten_clientes(client):
    respuesta_empresa = client.post(
        "/api/v1/auth/registro/empresa",
        json={
            "nombre_empresa": "Distribuidora Sur",
            "email": "admin@sur.com",
            "contrasena": "contrasenaSegura123",
            "confirmar_contrasena": "contrasenaSegura123",
            "nombre_completo": "Ana Admin",
        },
    )
    assert respuesta_empresa.status_code == 201
    client.post(BASE, json=PAYLOAD_CLIENTE)
    codigo = client.post("/api/v1/auth/invitaciones").json()["codigo"]
    client.cookies.clear()

    client.post(
        "/api/v1/auth/registro/chofer-invitado",
        json={
            "email": "chofer-sur@sur.com",
            "contrasena": "otraSegura123",
            "confirmar_contrasena": "otraSegura123",
            "nombre_completo": "Beto Chofer",
            "telefono": "+54 9 261 555-0200",
            "tipo_vehiculo": "furgon",
            "patente": "XY987ZW",
            "capacidad_carga_kg": 300,
            "codigo_invitacion": codigo,
        },
    )
    listado = client.get(BASE)
    assert listado.status_code == 200
    assert len(listado.json()) == 1
