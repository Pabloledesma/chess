# Guia de Despliegue en DigitalOcean

No necesitas dominio. Solo la IP publica de tu Droplet.

## 1. Crear Droplet en DigitalOcean

1. Entra a [cloud.digitalocean.com](https://cloud.digitalocean.com)
2. Crea un Droplet con **Ubuntu 22.04** (el plan basico de $6/mes funciona)
3. Elige autenticacion por **SSH key** (recomendado)
4. Una vez creado, copia la **IP publica** (ej: `143.198.50.10`)

## 2. Configurar el Servidor

Conéctate por SSH:

```bash
ssh root@TU_IP
```

Instala dependencias del sistema:

```bash
apt update && apt install -y nginx nodejs npm git
npm install -g pm2
```

## 3. Clonar el Repositorio

```bash
cd /var/www
git clone git@github.com:Pabloledesma/chess.git
cd chess
```

> Si usas HTTPS en vez de SSH:
> `git clone https://github.com/Pabloledesma/chess.git`

## 4. Instalar Dependencias y Build

```bash
# Backend
npm install --production

# Frontend
cd client
npm install
npm run build
cd ..
```

## 5. Configurar Nginx

```bash
sudo nano /etc/nginx/sites-available/chess
```

Pega esto (no hay que cambiar nada):

```nginx
server {
    listen 80;
    server_name _;

    root /var/www/chess/client/dist;
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

Activa el sitio:

```bash
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -s /etc/nginx/sites-available/chess /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 6. Iniciar el Backend

```bash
cd /var/www/chess
pm2 start server.js --name "chess-backend"
pm2 save
pm2 startup
```

## 7. Jugar

Abre en el navegador:

```
http://TU_IP?gameId=partida1
```

Comparte ese enlace con tu oponente. Para una partida nueva, cambia el gameId.

## Actualizar despues de cambios

Cuando hagas cambios en el codigo y los subas a GitHub:

```bash
ssh root@TU_IP
cd /var/www/chess
git pull
cd client && npm run build && cd ..
pm2 restart chess-backend
```

## Comandos utiles

```bash
pm2 logs chess-backend    # Ver logs
pm2 restart chess-backend # Reiniciar backend
pm2 status                # Ver estado
```
