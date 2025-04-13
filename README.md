# Node.js Application with Docker, Monitoring, and Backup

This repository contains a Node.js application deployed with Docker, including monitoring with Prometheus and Grafana, and MongoDB backup functionality.

## Project Structure

```
├── Dockerfile                         # Docker configuration for the Node.js app
├── app                                # Application directory
│   ├── app.js                         # Main application file
│   ├── package-lock.json              # NPM lock file
│   └── package.json                   # NPM package configuration
├── backup                             # Backup scripts and storage
│   ├── backup-mongodb.sh              # MongoDB backup script
│   └── local-backups                  # Directory for storing local backups
│       ├── mongodb_backup_20250412_163308.gz   # Example backup file
│       └── mongodb_backup_20250412_163711.gz   # Example backup file
├── bitbucket-pipelines.yml            # Bitbucket CI/CD configuration
├── docker-compose.mongodb-backup.yml  # Docker Compose for MongoDB backup
├── docker-compose.monitoring.yml      # Docker Compose for monitoring services
├── docker-compose.yml                 # Main Docker Compose for application
├── nginx                              # NGINX configuration
│   └── nginx.conf                     # NGINX server configuration
└── prometheus                         # Prometheus configuration
    └── prometheus.yml                 # Prometheus settings
```

## Deployment Instructions

### Prerequisites

- Docker and Docker Compose installed
- Git for repository cloning

### Step 1: Clone the Repository

```bash
git clone [repository-url]
cd [repository-name]
```

### Step 2: Deploy the Application

Deploy the main application stack including Node.js app, MongoDB, and NGINX reverse proxy:

```bash
docker-compose up -d
```

This command builds and starts all services defined in `docker-compose.yml`. The `-d` flag runs containers in the background.

### Step 3: Verify Deployment

Access the application at `http://localhost:8001` .

Check container status:

```bash
docker-compose ps
```

View application logs:

```bash
docker-compose logs -f nodejs-app
```

## Monitoring Setup

### Step 1: Deploy Monitoring Stack

Deploy Prometheus and Grafana for monitoring:

```bash
docker-compose -f docker-compose.monitoring.yml up -d
```

### Step 2: Access Monitoring Tools

- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3001`

### Step 3: Configure Grafana

1. Log in to Grafana (default credentials: admin/admin)
2. Add Prometheus as a data source:
   - URL: `http://prometheus:9090`
   - Access: Server (default)
3. Import dashboards or create custom ones for Node.js metrics

## Monitoring Details

The monitoring system consists of:

- **Prometheus**: Scrapes metrics from the Node.js application every 15 seconds through the metrics endpoint exposed on port 3000.
- **Grafana**: Provides interactive dashboards and visualizations using Prometheus as the data source.

The Node.js application exposes metrics at the `/metrics` endpoint, which is configured for Prometheus to scrape.

## Backup Procedures

### Automated MongoDB Backups

Run the MongoDB backup process:

```bash
docker-compose -f docker-compose.mongodb-backup.yml up
```

This executes the `backup-mongodb.sh` script which creates compressed backups of the MongoDB database.



### Backup Location

Backups are stored in the `backup/local-backups` directory with timestamps in the format `mongodb_backup_YYYYMMDD_HHMMSS.gz`.

## NGINX Configuration

The application uses NGINX as a reverse proxy with the following configuration:

```nginx
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
```

This configuration:
- Listens on port 80
- Forwards requests to the Node.js application running on port 3000
- Properly handles WebSocket connections
- Preserves client IP addresses and hostnames

## Troubleshooting

### Common Issues

1. **Application not accessible**:
   - Check if all containers are running: `docker-compose ps`
   - Verify NGINX configuration
   - Check Node.js app logs: `docker-compose logs nodejs-app`

2. **Monitoring not working**:
   - Ensure Prometheus can reach the application metrics endpoint
   - Check Prometheus targets page for scraping errors
   - Verify Grafana data source configuration

3. **Backup failures**:
   - Check backup logs: `docker-compose -f docker-compose.mongodb-backup.yml logs`
   - Ensure MongoDB container is accessible
   - Verify backup script permissions

## Maintenance

### Updating the Application

1. Pull latest changes from the repository
2. Rebuild and restart containers:
   ```bash
   docker-compose down
   docker-compose up -d --build
   ```

### Viewing Logs

```bash
# View logs from all services
docker-compose logs

# View logs from a specific service
docker-compose logs [service-name]

# Follow logs in real-time
docker-compose logs -f [service-name]
```

## CI/CD Integration

The project uses Bitbucket Pipelines for continuous integration and deployment with the configuration defined in `bitbucket-pipelines.yml`.




### Pipeline Workflow

1. **Trigger**: Any push to the `master` branch automatically triggers the pipeline.
2. **Authentication**: The pipeline logs into Docker Hub using credentials stored as secure repository variables (`DOCKER_USERNAME` and `DOCKER_PASSWORD`).
3. **Versioning**: Each build is tagged with both `latest` and the short commit hash for version tracking.
4. **Deployment**: The Docker image is built and pushed to Docker Hub, making it available for deployment.

### Security Note

Docker Hub credentials are stored as secure repository variables in Bitbucket to prevent exposure in the codebase.
