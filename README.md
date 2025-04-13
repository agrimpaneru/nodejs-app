# Node.js Dockerized Application with Monitoring and MongoDB Backups

This repository contains a fully Dockerized Node.js application integrated with:

- **NGINX** as a reverse proxy
- **MongoDB** as the backend database
- **Prometheus + Grafana** for application monitoring
- **MongoDB backup system** with automated cleanup
- All orchestrated using **Docker Compose**

---

## 📁 Project Structure

. ├── Dockerfile # Node.js app Dockerfile ├── app/ # Node.js application │ ├── app.js │ ├── package.json │ └── package-lock.json ├── backup/ # Backup scripts and local backups │ ├── backup-mongodb.sh │ └── local-backups/ ├── nginx/ # NGINX reverse proxy config │ └── nginx.conf ├── prometheus/ # Prometheus config │ └── prometheus.yml ├── bitbucket-pipelines.yml # CI/CD Pipeline (optional) ├── docker-compose.yml # Main application stack ├── docker-compose.monitoring.yml # Monitoring stack (Prometheus + Grafana) └── docker-compose.mongodb-backup.yml # MongoDB backup service

yaml
Copy
Edit

---

## 🚀 Deployment Instructions

### Step 1: Start Core Application

To deploy the Node.js application with MongoDB and NGINX reverse proxy, run:

```bash
docker-compose up -d
```
This will:

Start the Node.js app on port 3000

Start MongoDB

Start NGINX reverse proxy listening on port 80

Step 2: Access the Application
Visit your browser:

text
Copy
Edit
http://localhost
This routes through NGINX to nodejs-app:3000.

🌐 NGINX Configuration
Located at nginx/nginx.conf:

nginx
Copy
Edit
server {
  listen 80;

  location / {
    proxy_pass http://nodejs-app:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_cache_bypass $http_upgrade;
  }
}
This forwards all requests to the internal Node.js container.

📊 Monitoring with Prometheus + Grafana
Step 1: Start Monitoring Stack
bash
Copy
Edit
docker-compose -f docker-compose.monitoring.yml up -d
This starts:

Prometheus (default port: 9090)

Grafana (default port: 3001)

Step 2: Metric Exposure and Scraping
The Node.js application exposes Prometheus-compatible metrics on http://nodejs-app:3000/metrics.

Prometheus scrapes metrics every 15 seconds as defined in prometheus/prometheus.yml.

Step 3: Access Monitoring Dashboards
Prometheus: http://localhost:9090

Grafana: http://localhost:3001

Default login:

Username: admin

Password: admin

Configure Grafana to use Prometheus as a data source and build interactive dashboards from Node.js metrics.

💾 MongoDB Backups
Step 1: Start Backup Container
bash
Copy
Edit
docker-compose -f docker-compose.mongodb-backup.yml up -d
This will run a scheduled container to backup MongoDB.

Step 2: How It Works
Backups are stored in the backup/local-backups/ directory.

Backups are named with a timestamp like:
mongodb_backup_20250412_163308.gz

The backup script:

Uses mongodump with gzip compression

Keeps only the 7 most recent backups

Deletes older ones automatically

Step 3: Backup Script (backup/backup-mongodb.sh)
bash
Copy
Edit
#!/bin/bash

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
BACKUP_FILENAME="mongodb_backup_${TIMESTAMP}.gz"

mkdir -p ${BACKUP_DIR}

echo "Starting MongoDB backup at $(date)"
mongodump --host mongodb --port 27017 --username root --password example --authenticationDatabase admin --gzip --archive=${BACKUP_DIR}/${BACKUP_FILENAME}

if [ $? -eq 0 ]; then
  echo "Backup completed successfully: ${BACKUP_DIR}/${BACKUP_FILENAME}"
  ls -t ${BACKUP_DIR}/mongodb_backup_*.gz | tail -n +8 | xargs rm -f
  echo "Removed old backups, keeping the 7 most recent ones"
else
  echo "Backup failed!"
fi

echo "Backup process completed at $(date)"
Make sure the mongodb host, port, and credentials match your Docker Compose setup.

🐳 Docker Compose Summary
Compose File	Purpose
docker-compose.yml	Main application, MongoDB, NGINX
docker-compose.monitoring.yml	Prometheus and Grafana
docker-compose.mongodb-backup.yml	MongoDB backup container
✅ Prerequisites
Ensure you have the following installed:

Docker

Docker Compose

🧰 Useful Docker Commands
bash
Copy
Edit
docker-compose up -d                   # Start all services
docker-compose -f <file>.yml up -d     # Start services from specific file
docker-compose logs -f                 # Follow logs
docker-compose down                    # Stop and remove containers
docker-compose build                   # Rebuild containers
📬 Contact
For feedback or support, open an issue in this repository.

vbnet
Copy
Edit

Let me know if you'd like to also generate Grafana dashboard templates or Prometheus alert rules as part of the repo!







