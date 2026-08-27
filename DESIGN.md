---
name: Optimización de Rutas — Gran Mendoza
description: PWA de rutas de reparto para choferes y empresas de distribución del Gran Mendoza
colors:
  primario: "#7C3AED"
  primario-hover: "#6D28D9"
  exito: "#12B76A"
  exito-tint: "#ECFDF3"
  peligro: "#F04438"
  peligro-tint: "#FEF3F2"
  peligro-borde: "#FECDCA"
  fondo: "#E9EAEC"
  superficie: "#F5F6F8"
  blanco: "#FFFFFF"
  texto-fuerte: "#101828"
  texto-cuerpo: "#344054"
  texto-mutado: "#667085"
  texto-tenue: "#98A2B3"
  borde: "#E4E7EC"
  borde-input: "#D0D5DD"
typography:
  title:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "normal"
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "normal"
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.04em"
  data:
    fontFamily: "JetBrains Mono, ui-monospace, 'SF Mono', monospace"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "normal"
rounded:
  sm: "8px"
  md: "10px"
  lg: "14px"
  xl: "16px"
  pill: "999px"
spacing:
  campo-gap: "6px"
  campo-margen: "16px"
  tarjeta-padding: "32px 28px"
components:
  button-primario:
    backgroundColor: "{colors.primario}"
    textColor: "{colors.blanco}"
    rounded: "{rounded.lg}"
    padding: "0 24px"
    height: "50px"
  button-primario-hover:
    backgroundColor: "{colors.primario}"
  button-secundario:
    backgroundColor: "{colors.blanco}"
    textColor: "{colors.texto-fuerte}"
    rounded: "{rounded.lg}"
    height: "50px"
  button-exito:
    backgroundColor: "{colors.exito}"
    textColor: "{colors.blanco}"
    rounded: "{rounded.lg}"
    height: "50px"
  button-peligro:
    backgroundColor: "{colors.blanco}"
    textColor: "{colors.peligro}"
    rounded: "{rounded.lg}"
    height: "50px"
  input-campo:
    backgroundColor: "{colors.blanco}"
    textColor: "{colors.texto-fuerte}"
    rounded: "{rounded.md}"
    height: "46px"
    padding: "0 14px"
  card-tarjeta:
    backgroundColor: "{colors.blanco}"
    rounded: "{rounded.xl}"
    padding: "32px 28px"
  chip-estado:
    rounded: "{rounded.pill}"
---

# Design System: Optimización de Rutas — Gran Mendoza

## Overview

**Creative North Star: "La Libreta del Chofer"**

Directa y sin vueltas — como las anotaciones rápidas que hace un chofer entre entregas. La jerarquía de lectura siempre gana: un chofer con poco tiempo tiene que entender la pantalla de un vistazo, sin ambigüedad sobre qué botón apretar o qué campo falta completar. Dentro de esa claridad, el acabado es pulido y moderno — no austero: profundidad real (blur, sombras con offset), transiciones suaves, un único momento de movimiento autoral por pantalla en vez de efectos sueltos.

El violeta primario comunica confianza (es la acción principal, el color de marca); el verde éxito comunica avance — entregas completadas, confirmaciones, estados "todo en orden". Se rechaza explícitamente: texto en degradado, iconos como emoji/glifos Unicode, sombras duras sin blur, y cualquier decoración que no ayude a leer la pantalla más rápido.

**Key Characteristics:**
- Jerarquía de lectura por sobre el ornamento — el chofer entiende en segundos.
- Acabado pulido: vidrio (`backdrop-filter`) y sombras con profundidad real, no planas.
- Un único acento de color por pantalla — el violeta no compite consigo mismo.
- Español en toda la interfaz, sin excepción.

## Colors

Paleta restringida: neutrales + un acento violeta de confianza, con verde reservado exclusivamente para estados de éxito/avance.

### Primary
- **Violeta Confianza** (#7C3AED): acción principal — botones primarios, foco de inputs, enlaces, el trazo de ruta en overlays. Es el único acento que aparece libremente; en pantallas de datos se usa con moderación.
- **Violeta Confianza Hover** (#6D28D9): estado hover/press de todo lo que use el violeta primario.

### Secondary
- **Verde Progreso** (#12B76A): reservado a estados de éxito y avance — confirmaciones, "a tiempo", entregas completadas. Nunca se usa como color decorativo o de marca genérico.

### Neutral
- **Gris Base** (#E9EAEC): fondo de página por defecto (donde no hay foto).
- **Superficie** (#F5F6F8): fondo de tarjetas cuando no llevan vidrio.
- **Blanco** (#FFFFFF): inputs, fondo de botones secundarios.
- **Texto Fuerte** (#101828): títulos, texto de mayor jerarquía.
- **Texto Cuerpo** (#344054): texto de lectura estándar.
- **Texto Mutado** (#667085): subtítulos, texto secundario.
- **Texto Tenue** (#98A2B3): placeholders, texto terciario.
- **Borde** (#E4E7EC): bordes de tarjetas y separadores.
- **Borde Input** (#D0D5DD): borde por defecto de campos de formulario.

Semántico (no forma parte de Primary/Secondary/Neutral pero es parte fija del sistema): **Peligro** (#F04438) con su tinte (#FEF3F2) y borde (#FECDCA) — exclusivo para errores de validación y estados destructivos. Nunca se reutiliza fuera de ese rol.

### Named Rules
**The One Accent Rule.** El violeta primario es la única marca de color libre en una pantalla; el verde solo aparece cuando hay algo genuinamente completado o exitoso que señalar. Si ambos aparecen juntos sin ese motivo, el acento perdió su significado.

## Typography

**Body Font:** Inter (con system-ui, sans-serif de respaldo)
**Label/Mono Font:** JetBrains Mono (con ui-monospace, 'SF Mono', monospace de respaldo) — reservado a datos numéricos (ETAs, cargas, distancias) en las pantallas operativas del chofer; no se usa en login/registro porque ahí no hay datos que tabular.

**Character:** Inter cubre lectura de UI general — neutro, sin personalidad propia, elegido por legibilidad a tamaños chicos en pantallas de celular con poca luz. JetBrains Mono aparece únicamente donde un número necesita alinearse o leerse sin ambigüedad (nunca como "costume" de lo técnico).

### Hierarchy
- **Title** (700, 20px, 1.2): títulos de tarjeta — "Iniciar sesión", "Crear cuenta".
- **Body** (400, 13–14px, 1.4): texto de inputs, subtítulos, descripciones.
- **Label** (600, 11px, tracking 0.04em, mayúsculas): etiquetas de campo de formulario.
- **Data** (500, 13px, JetBrains Mono): valores numéricos en pantallas operativas (fuera del alcance de login/registro, ya establecido para uso futuro).

### Named Rules
**The No-Costume Rule.** JetBrains Mono aparece solo donde hay un número real que leer — nunca para que un bloque de texto "se vea técnico".

## Layout

Página de auth centrada: contenido en una columna única, `max-width: 400px`, centrado vertical y horizontalmente sobre el viewport completo (`min-height: 100dvh`). Padding de página 32px vertical / 20px horizontal. Mobile-first: el diseño nace pensado para 390px de ancho (el dispositivo principal del chofer) y escala hacia arriba sin cambiar de estructura — no hay un layout de escritorio distinto, la misma columna centrada simplemente flota sobre un lienzo más grande.

## Elevation & Depth

Sistema híbrido: sombras suaves con offset+blur real (nunca halos de offset cero) combinadas con vidrio (`backdrop-filter: blur`) donde el contenido flota sobre una foto — el vidrio es un efecto deliberado y específico (visiblemente desenfoca lo que hay detrás), no decoración cosmética.

### Shadow Vocabulary
- **Sombra Base** (`0 1px 2px rgba(16,24,40,0.04)`): tarjetas planas sobre fondo sólido.
- **Sombra Media** (`0 2px 6px rgba(16,24,40,0.08)`): tarjetas de contenido, filas de lista.
- **Sombra Botón Primario** (`0 4px 10px rgba(124,58,237,0.24)`): botones de acción principal.
- **Sombra Botón Éxito** (`0 4px 10px rgba(18,183,106,0.28)`): botones de confirmación/éxito.
- **Sombra Tarjeta Vidrio** (`0 24px 48px -12px rgba(16,24,40,0.35)`): tarjetas flotando sobre foto — elevación marcadamente mayor porque compite visualmente con una imagen de fondo, no con un color plano.

### Named Rules
**The Single Elevation Rule.** Una tarjeta declara su elevación con sombra O con borde marcado — nunca ambos compitiendo (eso es la "ghost card"). El borde de una tarjeta de vidrio (`rgba(255,255,255,0.5)`, 1px) no es elevación: es legibilidad de canto contra una foto variable, un rol distinto.

## Shapes

Radios grandes y consistentes: 8px en controles chicos, 10px en inputs, 14–16px en tarjetas y botones, píldora (999px) reservada a chips de estado. Sin esquinas afiladas en ningún componente interactivo. Bordes en su mayoría de 1–1.5px, siempre hairline — nunca gruesos ni como acento decorativo.

## Components

### Buttons
- **Shape:** radio 14px (`--radio-lg`), ancho completo, alto fijo 50px.
- **Primary:** fondo violeta confianza, texto blanco, sombra de color a juego; en hover se aclara levemente (`filter: brightness(1.06)`) y la sombra crece. Acción principal/creación (guardar, optimizar, agregar).
- **Secondary:** fondo blanco, borde hairline, texto fuerte; en hover pasa a fondo gris base. Acción neutra (cancelar, volver, editar).
- **Éxito** (`--color-exito`, mismo shape/alto que Primary): reservado a acciones que hacen avanzar el ciclo de vida de una ruta — confirmar, iniciar, marcar parada visitada. No es un primary alternativo: dos acentos libres en la misma pantalla (violeta + verde sin motivo) rompen la regla de abajo, así que solo aparece cuando hay una progresión real que señalar.
- **Peligro** (outline: fondo blanco, texto y borde `--color-peligro`; hover pasa a `--color-peligro-tint`): exclusivo para acciones destructivas irreversibles (eliminar ruta). Deliberadamente no es un fill sólido — la acción más deseada de la pantalla ya tiene el peso visual (violeta o verde), destructivo no debe competir por esa jerarquía.
- **Chica** (modificador `--chica`: alto 36px, ancho automático, padding 16px): variante compacta para una acción puntual dentro de una fila de lista (ej. "Marcar visitada" en una tarjeta de parada) — nunca para la acción principal de una pantalla.
- **Focus:** anillo de foco temático (2px violeta confianza, offset 3px) — nunca el outline azul genérico del navegador.
- **Estados:** `disabled` baja opacidad a 0.55 y cancela el transform de press; `cargando` reemplaza el texto por "Un momento…" en vez de un spinner.

### Cards / Containers
- **Corner Style:** 16px (`--radio-xl`) en tarjetas grandes, 14px (`--radio-lg`) en filas de lista.
- **Background:** blanco sólido en pantallas operativas (post-login) — el fondo de página (`--color-fondo`, gris) es lo bastante cercano a `--color-superficie` que dos tarjetas apiladas ahí se leían como una sola masa gris; blanco puro da la separación real que la regla de elevación de abajo asume. `--color-superficie` sigue siendo el fondo de la cabecera/pestañas (un peldaño de jerarquía entre el fondo de página y las tarjetas de contenido). Vidrio translúcido (`rgba(245,246,248,0.86)` + `backdrop-filter: blur(20px) saturate(140%)`) sigue siendo exclusivo de las pantallas de login/registro, sobre foto.
- **Shadow Strategy:** ver Elevation & Depth — sombra sola, nunca junto a un borde grueso. Excepción con rol distinto (no elevación): una tarjeta de parada "en curso" lleva un anillo `--color-exito` de 1.5px para señalar cuál es la próxima parada — es el mismo tipo de "borde con propósito distinto a elevación" que ya describe el borde de vidrio, aplicado a estado en vez de a legibilidad de canto.
- **Border:** hairline 1px, blanco semitransparente en la variante de vidrio (definición de canto, no elevación).
- **Internal Padding:** 32px vertical / 28px horizontal en tarjetas grandes; 14px/16px en filas de lista compactas.

### Chip de estado
Píldora (`--radio-pill`) para el estado de una `Ruta`: fondo = tinte del color semántico, texto = el color semántico sólido, mismo patrón que ya usan los tintes de Peligro. `planificada` usa violeta confianza al 10% (no hay tinte de marca predefinido, es el único chip que no reusa un tinte semántico existente); `en_curso`/`completada` usan `--color-exito-tint`; `cancelada` usa `--color-peligro-tint`. `en_curso` suma un punto de 6px con el mismo pulso continuo que ya define el Overlay de Ruta — misma convención de "el destino/lo activo pulsa", reutilizada en vez de inventada de nuevo.

### Inputs / Fields
- **Style:** fondo blanco sólido (incluso sobre tarjetas de vidrio, para mantener el contraste de escritura), borde `--color-borde-input`, radio 10px, alto 46px.
- **Focus:** borde pasa a violeta confianza + halo de `box-shadow` (`0 0 0 3px rgba(124,58,237,0.15)`) — nunca solo el outline nativo.
- **Error:** borde pasa a rojo peligro; el mensaje de error vive debajo del campo, no dentro.

### Overlay de Ruta (componente de firma)
SVG decorativo que traza una línea de ruta con un pin de inicio oscuro y un pin de destino en violeta confianza con anillo de pulso — la misma convención visual que usa la pantalla operativa "Ruta Activa" del producto (oscuro = punto de partida, violeta = destino). Aparece detrás de las pantallas de login/registro sobre la foto de fondo, animándose una sola vez al montar (trazo + aparición de pines + pulso continuo en el destino). No es decoración genérica: conecta el momento de iniciar sesión con la experiencia de ruta que el chofer va a usar el resto del día.

## Do's and Don'ts

### Do:
- **Do** usar el violeta confianza como único acento libre por pantalla; el verde solo para éxito/avance real.
- **Do** declarar la elevación de una tarjeta con sombra sola (o borde sutil de vidrio con un propósito distinto, nunca los dos compitiendo).
- **Do** usar JetBrains Mono únicamente cuando hay un valor numérico real que mostrar.
- **Do** dar a cada anillo de foco un tratamiento temático (violeta confianza), nunca dejar el outline nativo del navegador sin tocar.
- **Do** limitar el movimiento autoral a un momento por pantalla, orquestado, no efectos sueltos por elemento.

### Don't:
- **Don't** usar gradientes en texto para dar énfasis — el peso o el tamaño ya lo resuelven.
- **Don't** usar emoji o glifos Unicode como sistema de íconos.
- **Don't** combinar borde grueso + sombra ancha en la misma tarjeta compitiendo por elevación.
- **Don't** usar sombras de offset cero (halos de color) como sustituto de profundidad real.
- **Don't** reutilizar el rojo de peligro fuera de errores/estados destructivos.
