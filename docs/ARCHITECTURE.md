# Arquitectura

## Separación de responsabilidades

`src/app/App.tsx` compone canvas y HUD. `Application` de `@playcanvas/react` crea el motor y `Scene` obtiene la aplicación mediante el hook oficial `useApp`. Su efecto monta un `Runtime` y lo destruye al desmontar. GameStore publica snapshots cada 100 ms. Los componentes del HUD usan selectores escalares con useSyncExternalStore; App no se suscribe al snapshot completo. El diagnóstico se actualiza por separado. El indicador recibe coordenadas por frame mediante store.onIndicator y mueve su botón por ref, sin renders React.

| Archivo                                                       | Responsabilidad                                                                |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `src/game/Scene.tsx`                                          | Integración del lifecycle React / PlayCanvas                                   |
| `src/game/runtime.ts`                                         | Orquestación del update, inputs, cámara, colisión, acciones y ambiente         |
| `src/game/logic.ts`                                           | Dirección, distancia, proximidad y persistencia, sin dependencia del mundo     |
| `src/game/navigation.ts`                                      | NavGrid precalculada, A* con heap binario, segmentos y movimiento con colisión |
| `src/game/fsm.ts`                                             | Tabla de estados, eventos y duraciones                                         |
| `src/game/avatarController.ts`                                | Movimiento, rutas y transiciones de asiento, sin PlayCanvas                    |
| `src/game/input.ts`                                           | Input físico por e.code, pointer y wheel                                       |
| `src/game/camera.ts`                                          | Encuadre y proyección sin crear objetos por frame                              |
| `src/game/interactions.ts`                                    | Handler por tipo de objeto                                                     |
| `src/game/ambient.ts`                                         | Luz, polvo y gotas de agua                                                     |
| `src/game/store.ts`                                           | Snapshots, comandos tipados e indicador                                        |
| `src/game/avatar.ts`                                          | Jerarquía de pivotes, geometría original y animación de poses                  |
| `src/game/audio.ts`                                           | Ciclo de vida del elemento de audio local                                      |
| `src/world/build.ts`                                          | Composición de estudio, pasillo y dormitorio                                   |
| `src/world/builder.ts`                                        | Entidades, meshes, materiales y cajas fusionadas por color                     |
| `src/world/props.ts`, `studio.ts`, `hallway.ts`, `bedroom.ts` | Objetos y construcción de cada zona                                            |
| `src/world/layout.ts`                                         | Fuente única de posiciones, áreas y estructura                                 |
| `src/world/scripts.ts`                                        | Scripts ESM Sway, Spin y Groove                                                |
| `src/world/instanced.ts`                                      | Instancing de partículas con buffers reutilizables                             |
| `src/world/config.ts`                                         | Datos de colisiones y objetos interactivos                                     |
| `src/ui/Panel.tsx`                                            | Libros, notas, llamada local, ayuda, ajustes y foco                            |
| `src/app/style.css`                                           | Diseño, responsive, foco visible y movimiento reducido                         |

`GameStore.send` expone comandos tipados al HUD. `Snapshot` expone exclusivamente estado observable. Una implementación de red futura puede sustituir el transporte sin meter sockets en componentes de presentación. `Interactive` define id, tipo, posición, punto de acceso, radio, estado y opcionalmente posición/ángulo de asiento. El dispatch central usa el tipo de objeto para ejecutar la acción. Las entidades no se reconstruyen al cambiar el estado del HUD.

## Movimiento y navegación

El plano del juego es XZ. La dirección visual de teclado se transforma por 45° y se normaliza, evitando velocidad extra en diagonales. La velocidad es 1.85 unidades/s y 2.65 con Shift. Una circunferencia aproximada de radio .24 se representa inflando rectángulos de muebles; se prueban por separado ambos ejes para deslizarse sin vibración. El piso caminable es una lista de rectángulos (`floorAreas` en `src/world/config.ts`): estudio, pasillo y dormitorio, con margen respecto de las paredes; el pasillo se superpone con ambos cuartos para cruzar los umbrales. Obstáculos estructurales cubren el vacío a los lados del pasillo y la pared con puerta del dormitorio, así la simplificación de trayectorias sólo puede cruzar por la puerta. La cámara encuadra el cuarto que contiene al avatar (`rooms`); en el pasillo, el más cercano, con una escala ortográfica por cuarto.

El clic usa dos puntos `screenToWorld` de la cámara, con dimensiones CSS del canvas, y la intersección del rayo con el piso. Rechaza destinos ocupados. NavGrid calcula la ocupación y los ocho enlaces válidos por celda una vez; cada enlace verifica el piso y los colliders. A* usa claves numéricas y heap binario con prioridades inmutables por entrada, celdas de .4, vecinos ortogonales/diagonales, costos euclídeos y validación de las celdas laterales para no cortar esquinas. Los segmentos permanecen dentro de la unión de floorAreas. La trayectoria se simplifica con intersección exacta segmento/rectángulo inflado (método de slabs). Los puntos inicial/final se enlazan a celdas libres mediante segmentos también validados, incluso cuando el redondeo directo cae dentro de un mueble. Al caminar se limita cada paso al destino para no oscilar alrededor de un waypoint. El delta máximo es .1 s para limitar desplazamientos después de pausar la pestaña; por debajo de 10 FPS el tiempo del juego se desacelera antes de permitir saltos grandes.

La selección de proximidad compara distancia al **punto de acceso**, no al centro del mueble; es importante para objetos grandes y asientos. Un único indicador evita saturación.

## Animación

Nilo tiene pivotes de hombros, caderas, cuerpo y cabeza. No hay assets de clips ni dependencia de rigs externos. AvatarController maneja intención y posición; Avatar sólo representa las poses. La FSM define transiciones y duraciones en una tabla. Los estados son IDLE, WALKING, TURNING, SITTING, STANDING, WAVING e INTERACTING. Los giros grandes usan TURNING antes de caminar y se interpolan por el arco corto. Brazos y piernas alternan según velocidad, con respiración y parpadeo en reposo.

Las interacciones bloquean la caminata brevemente. SITTING ignora movimiento/saludo hasta STANDING. Las transiciones de asiento interpolan posición con smoothstep y las poses mediante un filtro exponencial. El punto de asiento puede estar dentro del collider del mueble: es la única excepción explícita al controlador de circulación. El punto de levantarse permanece en espacio libre.

## Renderizado y recursos

Cámara ortográfica, azimut 45°, elevación ~34°. Seguimiento al 65% de la posición del avatar para conservar contexto. Encuadre adaptable al aspect ratio. Luz direccional cálida, relleno frío suave y omni de lámpara. Sombras PCF5 de 2048 sólo en calidad alta, sin sombras locales. Tonemapping ACES.

El mesh de caja redondeada se genera una vez con proyección sobre un núcleo cúbico y normales curvas. Materiales se cachean por color/emisión y tienen gloss normalizado .18. El error de usar valores de gloss del antiguo shininess 0–100 provocaba superficies blancas: corregido y revisado en Chromium.

La geometría estática se agrupa mediante el batcher del motor, excluyendo entidades con el tag dynamic y sus descendientes. Las tablas del piso se fusionan por color (unas 12 entidades en vez de 132). Polvo y gotas usan instancing; las luces estáticas del dormitorio permanecen en el batch. Avatar, foliage, cortinas, pantalla, lámpara, reloj, radio, partículas e indicadores se excluyen del batching porque cambian transform/material. Ratio de píxeles limitado a 1.7 en alta y 1 en liviana. Sin geometría ni materiales nuevos por frame: el bombillo usa un material propio y sólo llama update durante el fundido. El cache compartido usa separador entre color y emisión.

El teardown quita listeners de teclado, blur, pointer y wheel, quita el callback update, detiene/libera audio, elimina el grupo de batching, destruye entidades y libera materiales/mesh propios. Las primitivas nativas pertenecen al cache del motor. `@playcanvas/react` administra la destrucción de la aplicación.

## Persistencia y accesibilidad

Claves con prefijo `cozy:`: `preferences`, `notes`, `lamp`. Escritura de notas explícita; preferencias sólo cuando cambian; lámpara sólo al interactuar. No hay escritura por frame. Lectura/parsing con fallback y protección frente a almacenamiento deshabilitado.

Los paneles suspenden input de juego, contienen Tab, cierran con Escape y recuperan el foco anterior cuando existe. Inputs/textarea no disparan movimiento. El HUD usa botones HTML, etiquetas, estados `aria-pressed`, foco visible y una región de estado textual. La preferencia de movimiento reducido del sistema se usa por defecto y se puede cambiar.

## Futuro multijugador

1. Parametrizar `Avatar` por ID y reutilizar el `AvatarController` puro existente.
2. Crear `WorldTransport` local y una implementación Colyseus; autoridad de posición/interacciones en servidor.
3. IDs persistentes de sala y usuario, snapshots con tiempo de servidor e interpolación para avatares remotos.
4. Commands para objetos, ownership de asientos, versiones para notas y límites de frecuencia.
5. Un adaptador LiveKit separado de `CozyAudio`, con consentimiento, indicadores y audio por distancia.
6. Mantener lógica pura y tests de navegación del cliente también en el servidor. No confiar en estados enviados por el cliente.

## Referencias consultadas

- [PlayCanvas React: instalación](https://developer.playcanvas.com/user-manual/react/getting-started/installation/)
- [Hook oficial useApp](https://developer.playcanvas.com/user-manual/react/api/hooks/use-app/)
- Tipos y fuente de PlayCanvas 2.23.1 / PlayCanvas React 0.11.7 instalados localmente, para validar APIs de cámara, render y batching.
