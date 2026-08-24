BASE = "/api/v1/auth"


def _registrar_empresa(client, email="admin@sur.com"):
    return client.post(
        f"{BASE}/registro/empresa",
        json={
            "nombre_empresa": "Distribuidora Sur",
            "email": email,
            "contrasena": "contrasenaSegura123",
            "nombre_completo": "Ana Admin",
        },
    )


def test_registro_chofer_independiente(client):
    respuesta = client.post(
        f"{BASE}/registro/chofer-independiente",
        json={
            "email": "indep@gmail.com",
            "contrasena": "soloYoManejo1",
            "nombre_completo": "Carlos Solo",
        },
    )
    assert respuesta.status_code == 201
    cuerpo = respuesta.json()
    assert cuerpo["rol"] == "chofer"
    assert cuerpo["empresa_id"] is None
    assert "token_acceso" in respuesta.cookies


def test_registro_chofer_independiente_email_duplicado(client):
    client.post(
        f"{BASE}/registro/chofer-independiente",
        json={"email": "dup@gmail.com", "contrasena": "soloYoManejo1", "nombre_completo": "Uno"},
    )
    respuesta = client.post(
        f"{BASE}/registro/chofer-independiente",
        json={"email": "dup@gmail.com", "contrasena": "otraClave123", "nombre_completo": "Dos"},
    )
    assert respuesta.status_code == 409


def test_registro_empresa_crea_usuario_admin(client):
    respuesta = _registrar_empresa(client)
    assert respuesta.status_code == 201
    cuerpo = respuesta.json()
    assert cuerpo["usuario"]["rol"] == "admin"
    assert cuerpo["usuario"]["empresa_id"] == cuerpo["empresa"]["id"]
    assert cuerpo["empresa"]["nombre"] == "Distribuidora Sur"


def test_flujo_invitacion_completo(client):
    respuesta_empresa = _registrar_empresa(client)
    empresa_id = respuesta_empresa.json()["empresa"]["id"]

    respuesta_codigo = client.post(f"{BASE}/invitaciones")
    assert respuesta_codigo.status_code == 201
    codigo = respuesta_codigo.json()["codigo"]

    respuesta_chofer = client.post(
        f"{BASE}/registro/chofer-invitado",
        json={
            "email": "chofer1@sur.com",
            "contrasena": "otraSegura123",
            "nombre_completo": "Beto Chofer",
            "codigo_invitacion": codigo,
        },
    )
    assert respuesta_chofer.status_code == 201
    assert respuesta_chofer.json()["empresa_id"] == empresa_id

    # el mismo código no se puede reutilizar
    respuesta_reuso = client.post(
        f"{BASE}/registro/chofer-invitado",
        json={
            "email": "chofer2@sur.com",
            "contrasena": "otraSegura123",
            "nombre_completo": "Otro Chofer",
            "codigo_invitacion": codigo,
        },
    )
    assert respuesta_reuso.status_code == 409


def test_registro_chofer_invitado_codigo_inexistente(client):
    respuesta = client.post(
        f"{BASE}/registro/chofer-invitado",
        json={
            "email": "nuevo@sur.com",
            "contrasena": "otraSegura123",
            "nombre_completo": "Nuevo",
            "codigo_invitacion": "NOEXISTE",
        },
    )
    assert respuesta.status_code == 404


def test_invitaciones_requiere_rol_admin(client):
    client.post(
        f"{BASE}/registro/chofer-independiente",
        json={
            "email": "indep2@gmail.com",
            "contrasena": "soloYoManejo1",
            "nombre_completo": "Carlos Solo",
        },
    )
    respuesta = client.post(f"{BASE}/invitaciones")
    assert respuesta.status_code == 403


def test_login_exitoso_y_me(client):
    _registrar_empresa(client)
    client.cookies.clear()

    respuesta_login = client.post(
        f"{BASE}/login", json={"email": "admin@sur.com", "contrasena": "contrasenaSegura123"}
    )
    assert respuesta_login.status_code == 200

    respuesta_me = client.get(f"{BASE}/me")
    assert respuesta_me.status_code == 200
    assert respuesta_me.json()["email"] == "admin@sur.com"


def test_login_credenciales_invalidas(client):
    _registrar_empresa(client)
    client.cookies.clear()

    respuesta = client.post(
        f"{BASE}/login", json={"email": "admin@sur.com", "contrasena": "incorrecta"}
    )
    assert respuesta.status_code == 401


def test_me_sin_sesion(client):
    respuesta = client.get(f"{BASE}/me")
    assert respuesta.status_code == 401


def test_logout_invalida_sesion(client):
    client.post(
        f"{BASE}/registro/chofer-independiente",
        json={
            "email": "indep3@gmail.com",
            "contrasena": "soloYoManejo1",
            "nombre_completo": "Carlos Solo",
        },
    )
    respuesta_logout = client.post(f"{BASE}/logout")
    assert respuesta_logout.status_code == 200

    respuesta_me = client.get(f"{BASE}/me")
    assert respuesta_me.status_code == 401
