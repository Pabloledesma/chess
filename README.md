# Chess Duel

Aplicacion de ajedrez en tiempo real para dos jugadores conectados mediante un enlace compartido.

## Stack

- **Backend:** Node.js + Express + Socket.io + SQLite
- **Frontend:** React 19 + Vite + Tailwind CSS
- **Tablero:** react-chessboard + chess.js

## Como ejecutar en desarrollo

```bash
# Backend (puerto 3000)
node server.js

# Frontend (en otra terminal)
cd client
npm run dev
```

Abre `http://localhost:5173?gameId=test` en dos pestanas del navegador.

## Como jugar

1. Ambos jugadores abren el mismo enlace con `?gameId=nombre-de-partida`
2. Cada uno elige nombre y avatar en la pantalla de bienvenida
3. Uno de los dos pulsa "Iniciar Partida" para arrancar los relojes
4. El turno cambia automaticamente al mover una pieza
5. La partida se guarda automaticamente y se puede retomar con el mismo enlace

## Despliegue

Ver [DEPLOY.md](DEPLOY.md) para instrucciones de despliegue en DigitalOcean.
