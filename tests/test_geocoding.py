from tests.conftest import payload_chofer

BASE_GEOCODING = "/api/v1/geocoding"


def _registrar_chofer_independiente(client, email="chofer-geo@test.com", patente="GEO111AA"):
    return client.post(
        "/api/v1/auth/registro/chofer-independiente", json=payload_chofer(email, patente=patente)
    )


def test_buscar_direccion_devuelve_resultados(client, monkeypatch):
    _registrar_chofer_independiente(client)

    def _busqueda_sintetica(direccion, limite=5):
        return [
            {
                "direccion": f"{direccion} 123, Mendoza, Argentina",
                "latitud": -32.89,
                "longitud": -68.82,
            }
        ]

    monkeypatch.setattr("api.routes_geocoding.geocodificar", _busqueda_sintetica)

    respuesta = client.get(f"{BASE_GEOCODING}/buscar", params={"q": "San Martin"})
    assert respuesta.status_code == 200
    cuerpo = respuesta.json()
    assert len(cuerpo) == 1
    assert cuerpo[0]["direccion"] == "San Martin 123, Mendoza, Argentina"
    assert cuerpo[0]["latitud"] == -32.89


def test_buscar_direccion_sin_resultados(client, monkeypatch):
    _registrar_chofer_independiente(client)
    monkeypatch.setattr("api.routes_geocoding.geocodificar", lambda direccion, limite=5: [])

    respuesta = client.get(f"{BASE_GEOCODING}/buscar", params={"q": "direccion inexistente"})
    assert respuesta.status_code == 200
    assert respuesta.json() == []


def test_buscar_direccion_requiere_autenticacion(client):
    respuesta = client.get(f"{BASE_GEOCODING}/buscar", params={"q": "San Martin"})
    assert respuesta.status_code == 401


def test_buscar_direccion_query_muy_corta_da_422(client):
    _registrar_chofer_independiente(client)
    respuesta = client.get(f"{BASE_GEOCODING}/buscar", params={"q": "ab"})
    assert respuesta.status_code == 422
