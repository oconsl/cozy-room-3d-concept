# Validación del prototipo

Fecha: 9 de octubre de 2026. Linux, pnpm 12.8.1, Chromium de Playwright 1.64.0 con WebGL2/SwiftShader. La validación de navegador usa el build servido por Vite Preview, no una maqueta del DOM.

## Evidencia automática

- `pnpm test`: **14 pruebas** de dirección según cámara, normalización, límites/colisiones, control cinemático, deslizamiento, proximity, FSM, A*, destinos accesibles, seguridad de todos los segmentos simplificados y persistencia/fallbacks.
- `pnpm build`: TypeScript estricto y bundle Vite de producción correctos.
- `pnpm test:e2e`: **2 recorridos** en Chromium. Uno abre la escena, verifica el avatar, mueve por teclado, saluda, cambia lámpara, se sienta/levanta, abre monitor, usa silla, navega directamente desde un asiento, elige libros, guarda notas, riega, reproduce/detiene audio, cambia cámara y recarga para verificar persistencia. El otro mueve por clic, cambia calidad, reducción de animaciones y FPS, revisa HUD a 390 × 844 y abre/cierra ayuda por teclado.
- El primer E2E intercepta todas las requests: permite exclusivamente `localhost` y `127.0.0.1`, rechaza y registra el resto. El resultado esperado y observado es **cero requests externas**. Captura tanto excepciones de página como mensajes de consola de nivel error, con resultado **cero errores**.

## Revisión visual real

Se inspeccionaron capturas de Chromium, incluyendo vista general, llamada, pantalla angosta y posición sentada. Se corrigieron materiales blancos por gloss fuera de rango, iluminación demasiado oscura, cara posterior visible de la pizarra, altura de la pose sentada y solapamiento del indicador con la cabeza del avatar.

| Captura                                  | Qué permite revisar                                  |
| ---------------------------------------- | ---------------------------------------------------- |
| [Vista general](cozyspace-overview.png)  | Las cuatro zonas, paleta, sombras, circulación y HUD |
| [Sentado](cozyspace-seated.png)          | Alineación sobre el cojín y pose articulada          |
| [Llamada local](cozyspace-call.png)      | Panel, legibilidad y coherencia con la escena        |
| [Pantalla angosta](cozyspace-mobile.png) | Encuadre estabilizado y controles accesibles         |

## Criterios de aceptación

| Criterios del pedido                                  | Evidencia                                                                                                          |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| 1, 17: localhost y producción                         | Servidor de desarrollo iniciado; build compilado y Preview recorrido por E2E                                       |
| 2, 18: offline y assets locales                       | Interceptor de requests; WAV y Nunito empaquetados; geometría procedural; no URLs externas en el runtime           |
| 3, 4, 5: habitación, cuatro zonas, muebles coherentes | Inspección visual de captura general y constructor de escena                                                       |
| 6: avatar original con detalle                        | Cabeza/cabello/rostro, sweater y bolsillo, piernas y calzado visibles; inspección de avatar y pose sentada         |
| 7, 8: WASD y clic                                     | E2E verifica desplazamiento observable en ambos modos                                                              |
| 9: colisiones/navegación                              | Pruebas de límites, obstáculos inflados, deslizamiento y todos los segmentos de rutas; recorrido E2E entre objetos |
| 10: reposo, caminar, saludo y sentado                 | FSM y poses en código; estados verificados por E2E, captura sentada y movimiento real                              |
| 11, 12, 13: objetos, luces y notas                    | Recorrido de los ocho objetos; lámpara on/off; notas recuperadas tras recarga                                      |
| 14: cámara general/seguimiento                        | Cambio de modo y persistencia comprobados por E2E; interpolación observada en captura                              |
| 15: UI coherente                                      | Inspección de HUD, llamada, libros, ayuda y ajustes; prueba de teclado y pantalla angosta                          |
| 16: consola                                           | E2E exige cero pageerrors y cero mensajes console.error                                                            |
| 19: organización y documentación                      | README, arquitectura, créditos, config por datos y separación React/motor                                          |
| 20: presentación para clase                           | Revisión visual y funcional realizada; la evaluación de una audiencia/clase real no forma parte de esta ejecución  |

## Alcance y límites de la verificación

No se promete una cifra universal de FPS. Se observaron tasas variables bajo rasterización por software (SwiftShader), que no representan una GPU de escritorio. El modo liviano y el contador de FPS están disponibles; falta un benchmark sistemático en hardware físico. No se ejecutó una matriz de Safari/Firefox ni una prueba prolongada de memoria con profiler. Los listeners y recursos se liberan explícitamente y las recargas del E2E no generan errores.

Los tests de movimiento revisan lógica/estados, no sustituyen una medición de sensación de control por usuarios. Las colisiones son aproximaciones sobre XZ; no hay física de objetos ni navegación con obstáculos móviles. En móvil se conserva el diorama y funciona selección de destinos, pero los controles principales están diseñados para escritorio.

El build muestra advertencias del bundle de PlayCanvas (>500 kB) y módulos `node:worker_threads` externalizados de parsers no usados. No impiden el build ni causan errores durante el recorrido verificado. La música sólo comienza por una acción explícita y puede quedar bloqueada según la política de reproducción del navegador.

## Correcciones verificadas durante desarrollo

- Gloss moderno normalizado: .18 en vez de 12; elimina superficies blancas.
- Waypoints: paso limitado a distancia restante; evita oscilación al bajar FPS.
- Visibilidad: intersección exacta segmento/rectángulo, en lugar de muestreo cada .08, que podía ignorar una esquina pequeña.
- Puntos de grilla: anclaje a celdas visibles y libres para no redondear un destino válido dentro de un mueble.
- Asientos: altura de pelvis coherente con cojín y transición hacia el punto de acceso antes de iniciar otra ruta.
- Cámara responsive: esperar el encuadre interpolado antes de capturar una pantalla angosta.
