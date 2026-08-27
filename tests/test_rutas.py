import pytest

from tests.conftest import payload_chofer

BASE_RUTAS = "/api/v1/rutas"
BASE_DEPOSITOS = "/api/v1/depositos"
BASE_CLIENTES = "/api/v1/clientes"

PAYLOAD_DEPOSITO = {"nombre": "Mi base", "latitud": -32.8908, "longitud": -68.8272}

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


def _registrar_chofer_independiente(client, email="chofer-ruta@test.com", patente="RT111AA"):
    return client.post(
        "/api/v1/auth/registro/chofer-independiente", json=payload_chofer(email, patente=patente)
    )


def _matriz_sintetica(coordenadas):
    # Distancias/tiempos con parte fraccionaria a propósito — OSRM real
    # devuelve floats (ej. 4538.5 metros), no enteros. Un valor entero acá
    # hubiera dejado pasar el bug de int_from_float que rompió esto en vivo.
    n = len(coordenadas)
    distancias = [[abs(i - j) * 1000.5 for j in range(n)] for i in range(n)]
    tiempos = [[abs(i - j) * 60.5 for j in range(n)] for i in range(n)]
    return {"matriz_distancias_metros": distancias, "matriz_tiempos_segundos": tiempos}


@pytest.fixture
def osrm_falso(monkeypatch):
    """Reemplaza la llamada real a OSRM por una matriz sintética
    determinística — evita depender del servidor público en los tests."""
    monkeypatch.setattr("routing.planificador.obtener_matriz_osrm", _matriz_sintetica)


def _geometria_sintetica(coordenadas):
    return [(c["latitud"], c["longitud"]) for c in coordenadas]


@pytest.fixture
def osrm_geometria_falsa(monkeypatch):
    monkeypatch.setattr("api.routes_rutas.obtener_geometria_osrm", _geometria_sintetica)


def _armar_chofer_con_lugares(client):
    _registrar_chofer_independiente(client)
    client.post(BASE_DEPOSITOS, json=PAYLOAD_DEPOSITO)
    cliente1 = client.post(BASE_CLIENTES, json=PAYLOAD_CLIENTE_1).json()
    cliente2 = client.post(BASE_CLIENTES, json=PAYLOAD_CLIENTE_2).json()
    return cliente1, cliente2


def test_optimizar_devuelve_preview_sin_persistir(client, osrm_falso):
    cliente1, cliente2 = _armar_chofer_con_lugares(client)

    respuesta = client.post(
        f"{BASE_RUTAS}/optimizar",
        json={
            "paradas": [
                {"cliente_id": cliente1["id"], "carga_kg": 10},
                {"cliente_id": cliente2["id"], "carga_kg": 5},
            ]
        },
    )
    assert respuesta.status_code == 200
    cuerpo = respuesta.json()
    assert len(cuerpo["paradas"]) == 2
    assert cuerpo["distancia_total_m"] > 0
    assert cuerpo["carga_total_kg"] == 15

    assert client.get(f"{BASE_RUTAS}/activa").json() is None


def test_confirmar_persiste_la_ruta(client, osrm_falso):
    cliente1, cliente2 = _armar_chofer_con_lugares(client)
    paradas = {
        "paradas": [
            {"cliente_id": cliente1["id"], "carga_kg": 10},
            {"cliente_id": cliente2["id"], "carga_kg": 5},
        ]
    }

    respuesta = client.post(f"{BASE_RUTAS}/confirmar", json=paradas)
    assert respuesta.status_code == 201
    cuerpo = respuesta.json()
    assert cuerpo["estado"] == "planificada"
    assert len(cuerpo["paradas"]) == 2
    assert "capacidad" in cuerpo["explicacion"].lower()

    activa = client.get(f"{BASE_RUTAS}/activa")
    assert activa.status_code == 200
    assert activa.json()["id"] == cuerpo["id"]
    # La explicación del preview se persiste, no solo se muestra una vez.
    assert activa.json()["explicacion"] == cuerpo["explicacion"]


def test_no_se_puede_confirmar_dos_rutas_el_mismo_dia(client, osrm_falso):
    cliente1, _ = _armar_chofer_con_lugares(client)
    paradas = {"paradas": [{"cliente_id": cliente1["id"], "carga_kg": 10}]}

    assert client.post(f"{BASE_RUTAS}/confirmar", json=paradas).status_code == 201
    respuesta = client.post(f"{BASE_RUTAS}/confirmar", json=paradas)
    assert respuesta.status_code == 409


def test_optimizar_sin_deposito_da_400(client, osrm_falso):
    _registrar_chofer_independiente(client)
    cliente = client.post(BASE_CLIENTES, json=PAYLOAD_CLIENTE_1).json()

    respuesta = client.post(
        f"{BASE_RUTAS}/optimizar",
        json={"paradas": [{"cliente_id": cliente["id"], "carga_kg": 10}]},
    )
    assert respuesta.status_code == 400


def test_optimizar_con_cliente_ajeno_da_400(client, osrm_falso):
    _registrar_chofer_independiente(client, email="dueno@test.com", patente="AA111AA")
    client.post(BASE_DEPOSITOS, json=PAYLOAD_DEPOSITO)
    cliente_ajeno = client.post(BASE_CLIENTES, json=PAYLOAD_CLIENTE_1).json()
    client.cookies.clear()

    _registrar_chofer_independiente(client, email="otro@test.com", patente="BB222BB")
    client.post(BASE_DEPOSITOS, json=PAYLOAD_DEPOSITO)
    respuesta = client.post(
        f"{BASE_RUTAS}/optimizar",
        json={"paradas": [{"cliente_id": cliente_ajeno["id"], "carga_kg": 10}]},
    )
    assert respuesta.status_code == 400


def test_chofer_de_empresa_no_puede_optimizar(client):
    respuesta_empresa = client.post(
        "/api/v1/auth/registro/empresa",
        json={
            "nombre_empresa": "Distribuidora Ruta",
            "email": "admin-ruta@test.com",
            "contrasena": "contrasenaSegura123",
            "confirmar_contrasena": "contrasenaSegura123",
            "nombre_completo": "Ana Admin",
        },
    )
    assert respuesta_empresa.status_code == 201

    respuesta = client.post(
        f"{BASE_RUTAS}/optimizar",
        json={
            "paradas": [
                {"cliente_id": "00000000-0000-0000-0000-000000000000", "carga_kg": 1},
            ]
        },
    )
    assert respuesta.status_code == 403


def test_ruta_activa_sin_ruta_devuelve_null(client):
    _registrar_chofer_independiente(client)
    respuesta = client.get(f"{BASE_RUTAS}/activa")
    assert respuesta.status_code == 200
    assert respuesta.json() is None


def test_optimizar_incluye_ahorro_y_explicacion(client, osrm_falso):
    cliente1, cliente2 = _armar_chofer_con_lugares(client)
    respuesta = client.post(
        f"{BASE_RUTAS}/optimizar",
        json={
            "paradas": [
                {"cliente_id": cliente1["id"], "carga_kg": 10},
                {"cliente_id": cliente2["id"], "carga_kg": 5},
            ]
        },
    )
    cuerpo = respuesta.json()
    # El óptimo nunca puede ser peor que el orden pedido — es la garantía
    # que hace honesto mostrar el ahorro.
    assert cuerpo["ahorro_m"] >= 0
    assert cuerpo["distancia_sin_optimizar_m"] >= cuerpo["distancia_total_m"]
    assert "capacidad" in cuerpo["explicacion"].lower()


def test_editar_ruta_reemplaza_la_planificada(client, osrm_falso):
    cliente1, cliente2 = _armar_chofer_con_lugares(client)
    original = client.post(
        f"{BASE_RUTAS}/confirmar",
        json={"paradas": [{"cliente_id": cliente1["id"], "carga_kg": 10}]},
    ).json()

    editada = client.put(
        f"{BASE_RUTAS}/activa",
        json={
            "paradas": [
                {"cliente_id": cliente1["id"], "carga_kg": 10},
                {"cliente_id": cliente2["id"], "carga_kg": 5},
            ]
        },
    )
    assert editada.status_code == 200
    cuerpo = editada.json()
    assert cuerpo["id"] != original["id"]
    assert len(cuerpo["paradas"]) == 2

    activa = client.get(f"{BASE_RUTAS}/activa").json()
    assert activa["id"] == cuerpo["id"]


def test_editar_sin_ruta_da_404(client):
    _registrar_chofer_independiente(client)
    respuesta = client.put(
        f"{BASE_RUTAS}/activa",
        json={"paradas": [{"cliente_id": "00000000-0000-0000-0000-000000000000", "carga_kg": 1}]},
    )
    assert respuesta.status_code == 404


def test_eliminar_ruta_activa(client, osrm_falso):
    cliente1, _ = _armar_chofer_con_lugares(client)
    client.post(
        f"{BASE_RUTAS}/confirmar",
        json={"paradas": [{"cliente_id": cliente1["id"], "carga_kg": 10}]},
    )

    respuesta = client.delete(f"{BASE_RUTAS}/activa")
    assert respuesta.status_code == 200
    assert client.get(f"{BASE_RUTAS}/activa").json() is None


def test_iniciar_sin_ruta_da_404(client):
    _registrar_chofer_independiente(client)
    assert client.post(f"{BASE_RUTAS}/activa/iniciar").status_code == 404


def test_iniciar_y_completar_paradas_cierra_la_ruta(client, osrm_falso):
    cliente1, cliente2 = _armar_chofer_con_lugares(client)
    client.post(
        f"{BASE_RUTAS}/confirmar",
        json={
            "paradas": [
                {"cliente_id": cliente1["id"], "carga_kg": 10},
                {"cliente_id": cliente2["id"], "carga_kg": 5},
            ]
        },
    )

    iniciada = client.post(f"{BASE_RUTAS}/activa/iniciar")
    assert iniciada.status_code == 200
    cuerpo = iniciada.json()
    assert cuerpo["estado"] == "en_curso"
    paradas_ordenadas = sorted(cuerpo["paradas"], key=lambda p: p["orden"])
    assert paradas_ordenadas[0]["estado"] == "en_curso"
    assert paradas_ordenadas[1]["estado"] == "pendiente"

    primera_id = paradas_ordenadas[0]["id"]
    segunda_id = paradas_ordenadas[1]["id"]

    despues_primera = client.post(f"{BASE_RUTAS}/activa/paradas/{primera_id}/completar")
    assert despues_primera.status_code == 200
    estados = {p["id"]: p["estado"] for p in despues_primera.json()["paradas"]}
    assert estados[primera_id] == "completada"
    assert estados[segunda_id] == "en_curso"

    despues_segunda = client.post(f"{BASE_RUTAS}/activa/paradas/{segunda_id}/completar")
    assert despues_segunda.status_code == 200
    assert despues_segunda.json()["estado"] == "completada"

    # Ni planificada ni en_curso: ya no es "la ruta activa".
    assert client.get(f"{BASE_RUTAS}/activa").json() is None


def test_no_se_puede_completar_parada_fuera_de_orden(client, osrm_falso):
    cliente1, cliente2 = _armar_chofer_con_lugares(client)
    ruta = client.post(
        f"{BASE_RUTAS}/confirmar",
        json={
            "paradas": [
                {"cliente_id": cliente1["id"], "carga_kg": 10},
                {"cliente_id": cliente2["id"], "carga_kg": 5},
            ]
        },
    ).json()
    client.post(f"{BASE_RUTAS}/activa/iniciar")

    segunda_id = sorted(ruta["paradas"], key=lambda p: p["orden"])[1]["id"]
    respuesta = client.post(f"{BASE_RUTAS}/activa/paradas/{segunda_id}/completar")
    assert respuesta.status_code == 409


def test_geometria_ruta_activa(client, osrm_falso, osrm_geometria_falsa):
    cliente1, _ = _armar_chofer_con_lugares(client)
    client.post(
        f"{BASE_RUTAS}/confirmar",
        json={"paradas": [{"cliente_id": cliente1["id"], "carga_kg": 10}]},
    )

    respuesta = client.get(f"{BASE_RUTAS}/activa/geometria")
    assert respuesta.status_code == 200
    assert len(respuesta.json()["puntos"]) >= 2
