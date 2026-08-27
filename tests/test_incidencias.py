from tests.conftest import crear_empresa_con_chofer

BASE_INCIDENCIAS = "/api/v1/incidencias"
BASE_EMPRESA = "/api/v1/empresa"
BASE_DEPOSITOS = "/api/v1/depositos"
BASE_CLIENTES = "/api/v1/clientes"

PAYLOAD_DEPOSITO = {"nombre": "Base", "latitud": -32.8908, "longitud": -68.8272}
PAYLOAD_CLIENTE = {
    "nombre": "Kiosco Don José",
    "direccion": "San Martín 123, Mendoza",
    "latitud": -32.8850,
    "longitud": -68.8200,
}


def _armar_ruta_para_chofer(client, chofer_id):
    client.post(BASE_DEPOSITOS, json=PAYLOAD_DEPOSITO)
    cliente = client.post(BASE_CLIENTES, json=PAYLOAD_CLIENTE).json()
    return client.post(
        f"{BASE_EMPRESA}/rutas",
        json={"chofer_id": chofer_id, "paradas": [{"cliente_id": cliente["id"], "carga_kg": 10}]},
    ).json()


def test_crear_y_listar_incidencia(client, osrm_falso):
    _, chofer = crear_empresa_con_chofer(client)
    ruta = _armar_ruta_para_chofer(client, chofer["id"])

    respuesta = client.post(
        BASE_INCIDENCIAS,
        json={"ruta_id": ruta["id"], "tipo": "cliente_ausente", "descripcion": "No había nadie."},
    )
    assert respuesta.status_code == 201
    cuerpo = respuesta.json()
    assert cuerpo["tipo"] == "cliente_ausente"
    assert cuerpo["descripcion"] == "No había nadie."

    listado = client.get(BASE_INCIDENCIAS)
    assert listado.status_code == 200
    assert len(listado.json()) == 1


def test_incidencia_sobre_parada_que_no_es_de_la_ruta_da_404(client, osrm_falso):
    _, chofer = crear_empresa_con_chofer(client)
    ruta = _armar_ruta_para_chofer(client, chofer["id"])

    respuesta = client.post(
        BASE_INCIDENCIAS,
        json={
            "ruta_id": ruta["id"],
            "parada_id": "00000000-0000-0000-0000-000000000000",
            "tipo": "otro",
        },
    )
    assert respuesta.status_code == 404


def test_incidencia_con_ruta_ajena_da_404(client, osrm_falso):
    _, chofer1 = crear_empresa_con_chofer(
        client,
        email_admin="admin1@test.com",
        email_chofer="chofer1@test.com",
        patente_chofer="XX111XX",
    )
    ruta = _armar_ruta_para_chofer(client, chofer1["id"])
    client.cookies.clear()

    crear_empresa_con_chofer(
        client,
        email_admin="admin2@test.com",
        email_chofer="chofer2@test.com",
        patente_chofer="ZZ222ZZ",
    )
    respuesta = client.post(BASE_INCIDENCIAS, json={"ruta_id": ruta["id"], "tipo": "otro"})
    assert respuesta.status_code == 404


def test_no_admin_no_puede_crear_ni_listar_incidencias(client):
    crear_empresa_con_chofer(client)
    client.cookies.clear()
    client.post(
        "/api/v1/auth/login", json={"email": "chofer@empresa.com", "contrasena": "otraSegura123"}
    )

    assert (
        client.post(
            BASE_INCIDENCIAS,
            json={"ruta_id": "00000000-0000-0000-0000-000000000000", "tipo": "otro"},
        ).status_code
        == 403
    )
    assert client.get(BASE_INCIDENCIAS).status_code == 403
