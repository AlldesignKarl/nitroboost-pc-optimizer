# NitroBoost

Aplicación de escritorio para Windows que monitoriza tu PC en tiempo real y activa
automáticamente un **Modo Turbo** cuando detecta que estás jugando: libera CPU/RAM,
pausa tareas no esenciales en segundo plano y lo revierte todo al salir del juego.

Construida con **Electron + React + TypeScript**.

## Zonas de la app

1. **Inicio** (`/`) — landing con la propuesta de valor y botón para entrar.
2. **Iniciar sesión** (`/login`) — cuenta local (usuario + contraseña, guardada
   cifrada solo en tu equipo, sin nube). Si es la primera vez que abres la app,
   este mismo formulario te deja crear la cuenta.
3. **Dashboard** (`/dashboard`) — panel con 5 pestañas:
   - **Resumen**: CPU, RAM, GPU, temperaturas, procesos activos, tiempo encendido.
   - **Red**: SSID, señal WiFi, ping y test de velocidad de descarga bajo demanda.
   - **Modo Juego**: estado del Modo Turbo, juego detectado, lista de
     optimizaciones aplicadas, activación manual.
   - **Historial**: sesiones de Modo Turbo y tests de velocidad guardados
     localmente.
   - **Ajustes**: qué optimizaciones se aplican, y las listas de apps a las que
     bajar prioridad o cerrar durante el juego.

## Cómo funciona el Modo Turbo

Cada pocos segundos, el proceso principal comprueba si hay un proceso de juego
conocido en ejecución (`electron/knownGames.ts`) o si la ventana en primer plano
ocupa toda la pantalla (`electron/gameDetector.ts`). Si detecta un juego y el
Modo Turbo no está activo, aplica (`electron/gameMode.ts`) las optimizaciones
que tengas activadas en Ajustes:

- Cambia el plan de energía a "Alto rendimiento".
- Pausa el indexado de Windows Search.
- Pausa temporalmente las descargas de Windows Update (`UsoClient PauseUpdates`).
- Pausa el **análisis programado** de Windows Defender (la protección en tiempo
  real sigue activa salvo que actives explícitamente la opción avanzada).
- Baja la prioridad de procesos en segundo plano que elijas (por defecto:
  OneDrive, Discord, Spotify, Teams, Skype).
- Opcionalmente cierra por completo apps que tú marques.
- Sube la prioridad del proceso del juego detectado.

Todo se revierte automáticamente en cuanto cierras el juego, al desactivar el
Modo Turbo manualmente, o pasadas 6 horas como red de seguridad si la app se
quedara colgada.

### Sobre pausar el antivirus

Por defecto **nunca se desactiva la protección en tiempo real** de Windows
Defender, solo el análisis programado (que es lo que realmente consume CPU/disco
en segundo plano). Desactivar la protección en tiempo real es una opción
**avanzada y desactivada por defecto** en Ajustes, con una confirmación
explícita, precisamente porque deja el equipo más expuesto mientras está activa.
Si la activas, se reactiva sola al salir del Modo Turbo.

## Requisitos

- Windows 10/11.
- Node.js 18+ para desarrollar/compilar.
- **Permisos de administrador**: el instalador registra la app para pedir
  elevación (`requestedExecutionLevel: requireAdministrator`) porque casi todas
  las optimizaciones (servicios, prioridad de procesos de otras apps, Defender)
  requieren admin en Windows.

## Desarrollo

```bash
npm install

# Terminal 1: servidor de Vite (UI) + Electron juntos
npm run electron:dev
```

En Windows, para que las optimizaciones reales funcionen en desarrollo, abre la
terminal como Administrador antes de ejecutar `npm run electron:dev`.

## Compilar el instalador de Windows

```bash
npm run build:win
```

Genera un instalador NSIS en `dist/`. Debe compilarse **en Windows** (o en
CI con un runner Windows); no se puede generar el `.exe` final desde Linux/macOS
con esta configuración.

## Limitaciones conocidas (honestidad ante todo)

- **Temperaturas**: se leen vía `systeminformation`, que en Windows depende de
  sensores WMI/OEM. En muchas placas base no exponen temperatura de CPU sin un
  driver adicional (tipo LibreHardwareMonitor); en ese caso el panel mostrará
  "N/D" en lugar de inventar un dato.
- **Test de velocidad**: mide únicamente **descarga** (vía el backend de
  fast.com, sin necesidad de API key). No mide subida ni jitter.
- **Cuentas**: son locales a cada PC, pensadas para separar perfiles/ajustes,
  no como sistema de autenticación en la nube.
- **Detección de juegos**: combina una lista curada de ejecutables conocidos +
  heurística de "ventana a pantalla completa". Puede no detectar juegos poco
  comunes: en ese caso, actívalo manualmente desde la pestaña Modo Juego.

## Estructura del proyecto

```
electron/         Proceso principal (main), preload, lógica de sistema
  main.ts          Ciclo de vida de la app, IPC, bucles de detección/monitor
  preload.ts       Puente seguro (contextBridge) hacia el renderer
  systemMonitor.ts CPU/RAM/GPU/temperaturas/red
  speedTest.ts     Test de velocidad de descarga
  gameDetector.ts  Detección de juego en ejecución
  gameMode.ts      Aplicar/revertir optimizaciones
  auth.ts          Login/registro local (bcrypt)
  store.ts         Persistencia local (electron-store)
  knownGames.ts     Lista de ejecutables de juegos conocidos
src/               Renderer (React)
  pages/           Home, Login, Dashboard (+ pestañas)
  AuthContext.tsx  Sesión en memoria del usuario logueado
```
