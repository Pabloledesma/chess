# Guía de Despliegue en DigitalOcean

Sigue estos pasos para poner tu aplicación de ajedrez en producción.

## 1. Preparación Local

Primero, genera la versión optimizada (build) del frontend:

```bash
cd client
npm run build
```

Esto creará una carpeta `dist` dentro de `client`. Esa carpeta contiene tu web lista para producción.

## 2. Configuración del Servidor (DigitalOcean Droplet)

Asumiendo que tienes un Droplet con Ubuntu y Nginx instalado. Si no:
`sudo apt update && sudo apt install nginx nodejs npm`

### Subir Archivos
Crea una carpeta en el servidor, por ejemplo: `/var/www/chess`.
Sube los archivos de tu proyecto local al servidor (puedes usar `scp` o FileZilla).
- Sube todo el backend (`server.js`, `package.json`, `chess.db` si quieres mantener historial).
- Sube la carpeta **`dist`** generada del frontend (`client/dist`) a `/var/www/chess/dist`.

Estructura final en servidor:
```
/var/www/chess/
├── server.js
├── package.json
├── chess.db
└── dist/        <-- Aquí va el contenido del build de React
    ├── index.html
    └── assets/
```

### Instalar Dependencias en el Servidor
Entra a la carpeta y ejecuta:
```bash
cd /var/www/chess
npm install --production
npm install sqlite3 # Reconstruir para el SO del servidor si hace falta
```

## 3. Configurar Nginx

Crea un archivo de configuración en `/etc/nginx/sites-available/chess`:

```bash
sudo nano /etc/nginx/sites-available/chess
```

Pega el contenido del archivo `nginx.conf` que te he generado (asegúrate de cambiar `server_name` y `root` si pusiste los archivos en otro lado).

Activa el sitio:
```bash
sudo ln -s /etc/nginx/sites-available/chess /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 4. Ejecutar el Backend (Process Manager)

Para que el servidor Node.js siga corriendo aunque cierres la terminal, usa `pm2`:

```bash
sudo npm install -g pm2
pm2 start server.js --name "chess-backend"
pm2 save
pm2 startup
```

## Comprobación
Entra a `http://TU-IP-O-DOMINIO` y debería cargar el juego.
