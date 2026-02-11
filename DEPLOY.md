# Guia de Despliegue en DigitalOcean

No necesitas dominio. Solo la IP publica de tu Droplet.

## 1. Preparacion Local

Genera el build del frontend:

```bash
cd client
npm run build
```

Esto crea la carpeta `client/dist` con la web lista para produccion.

## 2. Crear Droplet en DigitalOcean

1. Entra a [cloud.digitalocean.com](https://cloud.digitalocean.com)
2. Crea un Droplet con **Ubuntu 22.04** (el plan basico de $6/mes funciona)
3. Elige autenticacion por **SSH key** o **password**
4. Una vez creado, copia la **IP publica** (ej: `143.198.50.10`)

## 3. Configurar el Servidor

Conéctate por SSH:

```bash
ssh root@TU_IP
```

Instala las dependencias del sistema:

```bash
apt update && apt install -y nginx nodejs npm
npm install -g pm2
```

## 4. Subir Archivos

Desde tu maquina local, sube los archivos al servidor:

```bash
# Crear carpeta en el servidor
ssh root@TU_IP "mkdir -p /var/www/chess/dist"

# Subir backend
scp server.js package.json package-lock.json root@TU_IP:/var/www/chess/

# Subir frontend (build)
scp -r client/dist/* root@TU_IP:/var/www/chess/dist/

# (Opcional) Subir base de datos si quieres conservar partidas anteriores
scp chess.db root@TU_IP:/var/www/chess/
```

Estructura final en el servidor:

```
/var/www/chess/
├── server.js
├── package.json
├── chess.db
└── dist/
    ├── index.html
    └── assets/
```

## 5. Instalar Dependencias en el Servidor

```bash
ssh root@TU_IP
cd /var/www/chess
npm install --production
```

## 6. Configurar Nginx

Crea el archivo de configuracion:

```bash
sudo nano /etc/nginx/sites-available/chess
```

Pega esto (no hay que cambiar nada):

```nginx
server {
    listen 80;
    server_name _;

    root /var/www/chess/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Activa el sitio y reinicia Nginx:

```bash
# Quitar sitio por defecto de Nginx
sudo rm -f /etc/nginx/sites-enabled/default

# Activar chess
sudo ln -s /etc/nginx/sites-available/chess /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 7. Iniciar el Backend

```bash
cd /var/www/chess
pm2 start server.js --name "chess-backend"
pm2 save
pm2 startup
```

## 8. Jugar

Abre en el navegador:

```
http://TU_IP?gameId=partida1
```

Comparte ese mismo enlace con tu oponente. Ambos eligen nombre y avatar, uno pulsa "Iniciar Partida", y a jugar.

Para crear una partida nueva, cambia el `gameId`:

```
http://TU_IP?gameId=partida2
```

## Comandos utiles

```bash
# Ver logs del backend
pm2 logs chess-backend

# Reiniciar backend despues de subir cambios
pm2 restart chess-backend

# Ver estado
pm2 status
```
