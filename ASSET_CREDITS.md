# Assets y procedencia

## Recursos originales del prototipo

- **Habitación, muebles, avatar Nilo, plantas, cuadros, paisaje de ventana y partículas:** geometría procedural original en `src/world/build.ts` y `src/game/avatar.ts`. No se copiaron modelos, interfaces ni personajes de franquicias. No hay archivos GLB externos.
- **Portadas e ilustraciones de llamada:** HTML/CSS y símbolos tipográficos locales, composiciones originales en `src/ui/Panel.tsx`.
- **Iconos HUD:** paths SVG originales en `src/app/App.tsx`.
- **Domingo lento:** síntesis original de notas y acordes sinusoidales. WAV mono PCM de 16 segundos, 22050 Hz, `public/assets/sounds/sunday.wav`. No contiene samples externos. Generador reproducible: `scripts/generate-audio.py`.

## Tipografía

- **Nunito variable:** Copyright 2014 The Nunito Project Authors. SIL Open Font License 1.1. Fuente original de [google/fonts, ofl/nunito](https://github.com/google/fonts/tree/main/ofl/nunito), descargada durante desarrollo y empaquetada en `public/assets/fonts/Nunito.ttf`. Licencia completa en `public/assets/fonts/OFL.txt`. Sin modificaciones del archivo de fuente.
- Fallbacks: fuentes de sistema. Ninguna solicitud a un proveedor remoto en runtime.

## Assets evaluados y no incorporados

Se evaluó [Furniture Kit de Kenney](https://kenney.nl/assets/furniture-kit), autor Kenney, licencia CC0. Se eligió geometría propia para mantener proporciones, siluetas redondeadas y una sola paleta en todo el diorama. No se distribuyen archivos de ese kit.

## Dependencias

React (MIT), PlayCanvas Engine (MIT), @playcanvas/react (MIT), Vite (MIT) y herramientas de desarrollo mantienen sus licencias en los paquetes instalados. `pnpm-lock.yaml` fija las versiones de la instalación verificada.
