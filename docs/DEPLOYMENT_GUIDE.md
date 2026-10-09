# GUÍA DE DESPLIEGUE EN SERVIDOR DE PRODUCCIÓN (BHOps v1.0)
**Blue Hawk Technologies • Manual de Infraestructura y Puesta en Marcha**

---

## 1. REQUISITOS DEL SERVIDOR

| Recurso | Mínimo Recomendado | Recomendado para Cargas Altas |
| :--- | :--- | :--- |
| **Sistema Operativo** | Ubuntu Server 22.04 / 24.04 LTS (o Debian 12 / Windows Server 2022) | Ubuntu Server 24.04 LTS |
| **CPU** | 2 vCPUs | 4 vCPUs |
| **Memoria RAM** | 2 GB RAM | 4 GB a 8 GB RAM |
| **Almacenamiento** | 20 GB SSD | 50 GB NVMe |
| **Puertos de Red** | 80 (HTTP), 443 (HTTPS), 3000 (Next.js opcional), 8001 (FastAPI opcional) | 80, 443 |

---

## 2. OPCIÓN A: DESPLIEGUE CON DOCKER COMPOSE (RECOMENDADO)

Esta es la opción más rápida, aislada y estándar en entornos corporativos.

### Paso 1: Clonar el repositorio en el servidor
```bash
git clone https://github.com/johanBlueHawk/BlueHawk-Ops.git /opt/bhops
cd /opt/bhops
```

### Paso 2: Configurar las variables de entorno
```bash
cp backend/.env.example backend/.env
nano backend/.env
```
* **Variables esenciales a verificar en `backend/.env`**:
  * `SECRET_KEY`: Colocar una clave aleatoria de 32+ caracteres (`openssl rand -hex 32`).
  * `ALLOWED_ORIGINS`: Incluir el dominio o IP del servidor (ej. `http://192.168.10.200:3000,https://ops.bluehawk.tech`).
  * `ZAMMAD_API_TOKEN`: Token de la cuenta de Zammad con scope `ticket.agent`.

### Paso 3: Ejecutar el script automatizado
```bash
chmod +x deploy.sh
./deploy.sh
```
O manualmente:
```bash
docker compose up -d --build
```

### Paso 4: Verificar que los servicios estén corriendo
```bash
docker compose ps
docker compose logs -f
```

---

## 3. OPCIÓN B: DESPLIEGUE NATIVO (SYSTEMD + PM2 + NGXIN)

Si prefieres no usar contenedores Docker y correr directamente en el sistema operativo:

### 1. Dependencias del Sistema
```bash
sudo apt update && sudo apt install -y python3-pip python3-venv nodejs npm nginx curl
```

### 2. Configurar el Backend (FastAPI)
```bash
cd /opt/bhops/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Crear el servicio de systemd `/etc/systemd/system/bhops-backend.service`:
```ini
[Unit]
Description=Blue Hawk Ops Backend Core API
After=network.target

[Service]
User=www-data
WorkingDirectory=/opt/bhops/backend
ExecStart=/opt/bhops/backend/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8001
Restart=always

[Install]
WantedBy=multi-user.target
```
Habilitar y arrancar:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now bhops-backend
```

### 3. Configurar el Frontend (Next.js)
```bash
cd /opt/bhops/frontend
npm ci
npm run build
sudo npm install -g pm2
pm2 start npm --name "bhops-frontend" -- start -- -p 3000
pm2 save
pm2 startup
```

### 4. Configurar Nginx Reverse Proxy
Copiar la configuración de Nginx:
```bash
sudo cp /opt/bhops/nginx/nginx.conf /etc/nginx/sites-available/bhops
sudo ln -s /etc/nginx/sites-available/bhops /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 4. CERTIFICADO SSL (HTTPS CON LET'S ENCRYPT)

Si el servidor tiene un nombre de dominio público (ej. `ops.bluehawk.tech`):

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d ops.bluehawk.tech
```
Certbot configurará automáticamente la renovación periódica de certificados SSL.

---

## 5. CREDENCIALES POR DEFECTO PARA PRIMER INGRESO

Al iniciar por primera vez, el sistema genera automáticamente tres cuentas según el rol:

| Rol | Correo Electrónico | Contraseña Inicial |
| :--- | :--- | :--- |
| **Administrador (L3)** | `admin@bluehawk.tech` | `Johan_Admin#2026!SecOps` |
| **Técnico (L2)** | `tecnico@bluehawk.tech` | `Carlos_Tech#2026!OpsNOC` |
| **Operador (L1)** | `operador@bluehawk.tech` | `Marcos_Op#2026!Live247` |

*Recomendación de seguridad: Ingrese como Administrador y cambie las contraseñas desde el módulo de Gestión de Usuarios.*
