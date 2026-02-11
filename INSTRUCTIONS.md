# Contexto del Proyecto: Chess Duel

## 1. Objetivo
Aplicación de ajedrez privada en tiempo real para jugar entre dos personas (Padre e Hija) mediante un enlace con `gameId`.

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
