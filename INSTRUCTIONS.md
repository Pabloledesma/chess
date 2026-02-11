# Instrucciones de Instalación y Ejecución

## 1. Backend (Servidor Node.js)

Navega a la carpeta raíz del proyecto y ejecuta:

```bash
# Instalar dependencias
npm install

# Iniciar el servidor (puerto 3000)
node server.js
```

## 2. Frontend (React + Vite)

Navega a la carpeta `client` y ejecuta:

```bash
cd client

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo (puerto 5173 por defecto)
npm run dev
```

## 3. Despliegue (Nginx)

El archivo `nginx.conf` incluido muestra cómo configurar el proxy inverso para soportar WebSockets tanto para la aplicación React (si se sirve vía Node/Serve) como para el backend de Socket.io.
