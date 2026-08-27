from tests.conftest import crear_empresa_con_chofer, payload_chofer

BASE_EMPRESA = "/api/v1/empresa"
BASE_DEPOSITOS = "/api/v1/depositos"
BASE_CLIENTES = "/api/v1/clientes"

PAYLOAD_DEPOSITO = {"nombre": "Base", "latitud": -32.8908, "longitud": -68.8272}

PAYLOAD_CLIENTE_1 = {
    "nombre": "Kiosco Don José",
    "direccion": "San Martín 123, Mendoza",
    "latitud": -32.8850,
    "longitud": -68.8200,
}

PAYLOAD_CLIENTE_2 = {
    "nombre": "Ferretería Central",
    "direccion": "Av. San Martín 456, Mendoza",
    "latitud": -32.8950,
    "longitud": -68.8350,
}


def test_listar_choferes_de_la_empresa(client):
    _, chofer = crear_empresa_con_chofer(client)

    listado = client.get(f"{BASE_EMPRESA}/choferes")
    assert listado.status_code == 200
    assert len(listado.json()) == 1
    assert listado.json()[0]["id"] == chofer["id"]
    assert listado.json()[0]["vehiculo_patente"]


def test_asignar_ruta_a_chofer_de_la_empresa(client, osrm_falso):
    _, chofer = crear_empresa_con_chofer(client)
    client.post(BASE_DEPOSITOS, json=PAYLOAD_DEPOSITO)
    cliente = client.post(BASE_CLIENTES, json=PAYLOAD_CLIENTE_1).json()

    respuesta = client.post(
        f"{BASE_EMPRESA}/rutas",
        json={
            "chofer_id": chofer["id"],
            "paradas": [{"cliente_id": cliente["id"], "carga_kg": 10}],
        },
    )
    assert respuesta.status_code == 201
    cuerpo = respuesta.json()
    assert cuerpo["estado"] == "planificada"
    assert len(cuerpo["paradas"]) == 1


def test_asignar_ruta_a_chofer_ajeno_da_404(client, osrm_falso):
    crear_empresa_con_chofer(client)
    client.post(BASE_DEPOSITOS, json=PAYLOAD_DEPOSITO)
    cliente = client.post(BASE_CLIENTES, json=PAYLOAD_CLIENTE_1).json()

    respuesta = client.post(
        f"{BASE_EMPRESA}/rutas",
        json={
            "chofer_id": "00000000-0000-0000-0000-000000000000",
            "paradas": [{"cliente_id": cliente["id"], "carga_kg": 10}],
        },
    )
    assert respuesta.status_code == 404


def test_asignar_dos_rutas_el_mismo_dia_da_409(client, osrm_falso):
    _, chofer = crear_empresa_con_chofer(client)
    client.post(BASE_DEPOSITOS, json=PAYLOAD_DEPOSITO)
    cliente = client.post(BASE_CLIENTES, json=PAYLOAD_CLIENTE_1).json()
    paradas = {
        "chofer_id": chofer["id"],
        "paradas": [{"cliente_id": cliente["id"], "carga_kg": 10}],
    }

    assert client.post(f"{BASE_EMPRESA}/rutas", json=paradas).status_code == 201
    assert client.post(f"{BASE_EMPRESA}/rutas", json=paradas).status_code == 409


def test_listar_rutas_y_kpis_de_la_empresa(client, osrm_falso):
    _, chofer = crear_empresa_con_chofer(client)
    client.post(BASE_DEPOSITOS, json=PAYLOAD_DEPOSITO)
    cliente1 = client.post(BASE_CLIENTES, json=PAYLOAD_CLIENTE_1).json()
    cliente2 = client.post(BASE_CLIENTES, json=PAYLOAD_CLIENTE_2).json()
    client.post(
        f"{BASE_EMPRESA}/rutas",
        json={
            "chofer_id": chofer["id"],
            "paradas": [
                {"cliente_id": cliente1["id"], "carga_kg": 10},
                {"cliente_id": cliente2["id"], "carga_kg": 5},
            ],
        },
    )

    listado = client.get(f"{BASE_EMPRESA}/rutas")
    assert listado.status_code == 200
    assert len(listado.json()) == 1
    resumen = listado.json()[0]
    assert resumen["chofer_nombre"]
    assert resumen["total_paradas"] == 2
    assert resumen["en_riesgo"] is False

    kpis = client.get(f"{BASE_EMPRESA}/kpis").json()
    assert kpis["rutas_activas"] == 1
    assert kpis["total_paradas"] == 2
    assert kpis["paradas_pendientes"] == 2
    assert kpis["rutas_en_riesgo"] == 0


def test_pedidos_lista_paradas_aplanadas(client, osrm_falso):
    _, chofer = crear_empresa_con_chofer(client)
    client.post(BASE_DEPOSITOS, json=PAYLOAD_DEPOSITO)
    cliente = client.post(BASE_CLIENTES, json=PAYLOAD_CLIENTE_1).json()
    client.post(
        f"{BASE_EMPRESA}/rutas",
        json={
            "chofer_id": chofer["id"],
            "paradas": [{"cliente_id": cliente["id"], "carga_kg": 10}],
        },
    )

    pedidos = client.get(f"{BASE_EMPRESA}/pedidos")
    assert pedidos.status_code == 200
    assert len(pedidos.json()) == 1
    assert pedidos.json()[0]["cliente_nombre"] == PAYLOAD_CLIENTE_1["nombre"]


def test_rutas_de_otra_empresa_no_se_ven(client, osrm_falso):
    _, chofer1 = crear_empresa_con_chofer(
        client,
        email_admin="admin1@test.com",
        email_chofer="chofer1@test.com",
        patente_chofer="XX111XX",
    )
    client.post(BASE_DEPOSITOS, json=PAYLOAD_DEPOSITO)
    cliente1 = client.post(BASE_CLIENTES, json=PAYLOAD_CLIENTE_1).json()
    client.post(
        f"{BASE_EMPRESA}/rutas",
        json={
            "chofer_id": chofer1["id"],
            "paradas": [{"cliente_id": cliente1["id"], "carga_kg": 10}],
        },
    )
    client.cookies.clear()

    crear_empresa_con_chofer(
        client,
        email_admin="admin2@test.com",
        email_chofer="chofer2@test.com",
        patente_chofer="ZZ222ZZ",
    )
    assert client.get(f"{BASE_EMPRESA}/rutas").json() == []


def test_no_admin_no_puede_listar_rutas_empresa(client):
    client.post("/api/v1/auth/registro/chofer-independiente", json=payload_chofer("solo@test.com"))
    respuesta = client.get(f"{BASE_EMPRESA}/rutas")
    assert respuesta.status_code == 403
