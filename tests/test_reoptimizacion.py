from tests.conftest import crear_empresa_con_chofer

BASE_EMPRESA = "/api/v1/empresa"
BASE_DEPOSITOS = "/api/v1/depositos"
BASE_CLIENTES = "/api/v1/clientes"
BASE_RUTAS = "/api/v1/rutas"

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


def _asignar_ruta(client, chofer_id, clientes_con_carga):
    return client.post(
        f"{BASE_EMPRESA}/rutas",
        json={
            "chofer_id": chofer_id,
            "paradas": [
                {"cliente_id": cliente["id"], "carga_kg": carga}
                for cliente, carga in clientes_con_carga
            ],
        },
    ).json()


def _loguear(client, email, contrasena):
    client.cookies.clear()
    client.post("/api/v1/auth/login", json={"email": email, "contrasena": contrasena})


def test_reoptimizar_ruta_planificada(client, osrm_falso):
    _, chofer = crear_empresa_con_chofer(client)
    client.post(BASE_DEPOSITOS, json=PAYLOAD_DEPOSITO)
    cliente1 = client.post(BASE_CLIENTES, json=PAYLOAD_CLIENTE_1).json()
    cliente2 = client.post(BASE_CLIENTES, json=PAYLOAD_CLIENTE_2).json()
    ruta = _asignar_ruta(client, chofer["id"], [(cliente1, 10), (cliente2, 5)])

    respuesta = client.post(f"{BASE_EMPRESA}/rutas/{ruta['id']}/reoptimizar")
    assert respuesta.status_code == 200
    cuerpo = respuesta.json()
    assert len(cuerpo["paradas"]) == 2
    assert "reoptimizada" in cuerpo["explicacion"].lower()


def test_reoptimizar_ruta_en_curso_no_toca_paradas_completadas(client, osrm_falso):
    _, chofer = crear_empresa_con_chofer(client)
    client.post(BASE_DEPOSITOS, json=PAYLOAD_DEPOSITO)
    cliente1 = client.post(BASE_CLIENTES, json=PAYLOAD_CLIENTE_1).json()
    cliente2 = client.post(BASE_CLIENTES, json=PAYLOAD_CLIENTE_2).json()
    ruta = _asignar_ruta(client, chofer["id"], [(cliente1, 10), (cliente2, 5)])

    _loguear(client, "chofer@empresa.com", "otraSegura123")
    client.post(f"{BASE_RUTAS}/activa/iniciar")
    primera_id = min(ruta["paradas"], key=lambda p: p["orden"])["id"]
    client.post(f"{BASE_RUTAS}/activa/paradas/{primera_id}/completar")

    _loguear(client, "admin@empresa.com", "contrasenaSegura123")
    respuesta = client.post(f"{BASE_EMPRESA}/rutas/{ruta['id']}/reoptimizar")
    assert respuesta.status_code == 200
    cuerpo = respuesta.json()
    completada = next(p for p in cuerpo["paradas"] if p["id"] == primera_id)
    assert completada["estado"] == "completada"
    assert completada["orden"] == 0


def test_reoptimizar_sin_pendientes_da_400(client, osrm_falso):
    _, chofer = crear_empresa_con_chofer(client)
    client.post(BASE_DEPOSITOS, json=PAYLOAD_DEPOSITO)
    cliente1 = client.post(BASE_CLIENTES, json=PAYLOAD_CLIENTE_1).json()
    ruta = _asignar_ruta(client, chofer["id"], [(cliente1, 10)])

    _loguear(client, "chofer@empresa.com", "otraSegura123")
    client.post(f"{BASE_RUTAS}/activa/iniciar")
    primera_id = ruta["paradas"][0]["id"]
    client.post(f"{BASE_RUTAS}/activa/paradas/{primera_id}/completar")

    _loguear(client, "admin@empresa.com", "contrasenaSegura123")
    respuesta = client.post(f"{BASE_EMPRESA}/rutas/{ruta['id']}/reoptimizar")
    assert respuesta.status_code == 400


def test_reoptimizar_ruta_ajena_da_404(client, osrm_falso):
    _, chofer1 = crear_empresa_con_chofer(
        client,
        email_admin="admin1@test.com",
        email_chofer="chofer1@test.com",
        patente_chofer="XX111XX",
    )
    client.post(BASE_DEPOSITOS, json=PAYLOAD_DEPOSITO)
    cliente1 = client.post(BASE_CLIENTES, json=PAYLOAD_CLIENTE_1).json()
    ruta = _asignar_ruta(client, chofer1["id"], [(cliente1, 10)])
    client.cookies.clear()

    crear_empresa_con_chofer(
        client,
        email_admin="admin2@test.com",
        email_chofer="chofer2@test.com",
        patente_chofer="ZZ222ZZ",
    )
    respuesta = client.post(f"{BASE_EMPRESA}/rutas/{ruta['id']}/reoptimizar")
    assert respuesta.status_code == 404


def test_reoptimizar_dia_reporta_resultado_por_ruta(client, osrm_falso):
    _, chofer = crear_empresa_con_chofer(client)
    client.post(BASE_DEPOSITOS, json=PAYLOAD_DEPOSITO)
    cliente1 = client.post(BASE_CLIENTES, json=PAYLOAD_CLIENTE_1).json()
    ruta = _asignar_ruta(client, chofer["id"], [(cliente1, 10)])

    respuesta = client.post(f"{BASE_EMPRESA}/reoptimizar-dia")
    assert respuesta.status_code == 200
    resultados = respuesta.json()["resultados"]
    assert len(resultados) == 1
    assert resultados[0]["ruta_id"] == ruta["id"]
    assert resultados[0]["ok"] is True
