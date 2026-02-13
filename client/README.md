# Chess Duel

Aplicación de ajedrez privada en tiempo real para dos jugadores (Padre e Hija) conectados mediante un enlace con `gameId`.

## Stack

- **Backend:** Node.js + Express 5 + Socket.io (`server.js`, puerto 3000)
- **Frontend:** React 19 + Vite 7 + Tailwind CSS (`client/`)
- **Tablero:** react-chessboard + chess.js (validación de movimientos y estado FEN)
- **Base de datos:** SQLite3 (`chess.db`) — persistencia de movimientos
- **Deploy:** DigitalOcean Droplet + Nginx + PM2

## Arquitectura

```
/
├── server.js          # Backend: Express + Socket.io + Chess.js + SQLite
├── package.json       # Dependencias del backend
├── chess.db           # Base de datos SQLite
├── nginx.conf         # Config de proxy inverso para producción
├── client/
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   └── components/
│   │       ├── ChessGame.jsx    # Componente principal del tablero
│   │       ├── GameInfo.jsx     # Info de la partida (jugadores, reloj)
│   │       ├── MoveHistory.jsx  # Historial de movimientos
│   │       └── LoginModal.jsx   # Pantalla de bienvenida (nombre + avatar)
│   └── public/sounds/           # Archivos .mp3: move, capture, check, castle, win
```

## Flujo WebSocket

1. Cliente envía `joinGame` con `{ gameId, user }` → se une a sala
2. Servidor responde con `initGame` (fen, history, players, timers, color)
3. Movimientos: cliente envía `move` → servidor valida con chess.js → emite `gameState`
4. Cambio de turno: el jugador pulsa botón "FINALIZAR TURNO" → emite `switchTurn`
5. El turno NO cambia automáticamente al mover; requiere acción manual del jugador

## Comandos

```bash
# Backend
node server.js

# Frontend (desarrollo)
cd client && npm run dev

# Frontend (build producción)
cd client && npm run build

# Lint
cd client && npm run lint
```

## Reglas de desarrollo

- Idioma: todo el código, comentarios y mensajes en **español**
- Mantener el tablero responsivo para portátiles y tablets (Tailwind)
- Sonidos con la API de Audio de JavaScript (archivos en `client/public/sounds/`)
- Siempre sincronizar el estado FEN cuando un jugador nuevo entra a la sala
- Para despliegue con Nginx: mantener las cabeceras `Upgrade` y `Connection` para WebSockets
- El módulo del backend es CommonJS (`"type": "commonjs"`); el frontend es ESM

# Contexto del Proyecto: Chess Duel

## 1. Objetivo
Aplicación de ajedrez privada en tiempo real para jugar entre dos personas mediante un enlace con `gameId`.

## 2. Stack Tecnológico Actual
Basado en el archivo `package.json` y la estructura de archivos:

### Backend (Node.js/Express)
- **Framework:** Express.js ^5.2.1
- **Tiempo Real:** Socket.io ^4.8.3
- **Lógica de Ajedrez:** Chess.js ^1.4.0 (Encargado de validación de movimientos y estado FEN).
- **Base de Datos:** SQLite3 ^5.1.7 (Para persistencia de partidas/historial).
- **Servidor:** Corriendo en puerto 3000 (Node.js nativo con `server.js`).

### Frontend (React/Vite)
- **Herramienta de Construcción:** Vite
- **Estilos:** Tailwind CSS ^4.1.18, Autoprefixer, PostCSS.
- **Componente de Tablero:** react-chessboard ^5.10.0
- **Comunicación:** socket.io-client ^4.8.3

## 3. Arquitectura de Archivos
- `/client`: Directorio de la SPA en React.
- `/client/src/components`: Contiene `MoveHistory.jsx` (Historial de movimientos).
- `server.js`: Punto de entrada del backend.
- `nginx.conf`: Configuración para el proxy inverso en DigitalOcean.
- `chess.db`: Archivo de base de datos local para SQLite.

## 4. Flujo de Comunicación (WebSockets)
1. El cliente se une a una sala mediante el evento `joinGame` enviando un `gameId` desde la URL.
2. Los movimientos se envían al servidor mediante el evento `move`.
3. El servidor valida el movimiento con la instancia de `Chess.js`.
4. Si es válido, se emite el movimiento a todos los integrantes de la sala y se guarda en `chess.db`.

## 5. Reglas de Desarrollo para Antigravity
- **Prioridad:** Mantener el tablero responsivo (Tailwind) para que se vea bien en portátiles y tablets.
- **Sonidos:** Utilizar la API de Audio de JavaScript para reproducir sonidos de movimiento y captura (URLs de Lichess o locales).
- **Estado:** Siempre sincronizar el estado del tablero (FEN) cuando un jugador nuevo entre a la sala.
- **Nginx:** Al generar código de despliegue, recordar siempre las cabeceras `Upgrade` y `Connection` para WebSockets.

