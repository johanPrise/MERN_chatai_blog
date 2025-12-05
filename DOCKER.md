# Docker Deployment Guide

This guide explains how to deploy the MERN ChatAI Blog application using Docker and Docker Compose.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- At least 4GB RAM available for Docker
- 10GB free disk space

## Quick Start

### 1. Configure Environment Variables

```bash
# Copy the Docker environment template
cp .env.docker .env

# Edit the .env file with your configuration
nano .env
```

**Important:** Update these required variables:
- `MONGO_ROOT_PASSWORD` - Set a strong password for MongoDB
- `JWT_SECRET` - Generate a secure random string
- `EMAIL_*` - Configure email service (optional)
- `AI_API_KEY` - Add your AI API key (optional)

### 2. Start All Services

```bash
# Build and start all containers
docker-compose up -d

# View logs
docker-compose logs -f

# Check service status
docker-compose ps
```

### 3. Access the Application

- **Frontend**: http://localhost:80
- **Backend API**: http://localhost:4200
- **API Health Check**: http://localhost:4200/api/v1/health

## Architecture

The Docker setup includes:

```
┌─────────────────────────────────────────────────┐
│                   Frontend                       │
│              (Nginx + React SPA)                 │
│                  Port: 80                        │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│                  Backend API                     │
│             (Fastify + Node.js)                  │
│                  Port: 4200                      │
└─────────────┬──────────────┬────────────────────┘
              │              │
    ┌─────────▼──────┐  ┌───▼──────────┐
    │    MongoDB     │  │    Redis     │
    │   Port: 27017  │  │  Port: 6379  │
    └────────────────┘  └──────────────┘
```

## Services

### Frontend (Nginx)

- **Image**: Custom build from `./Dockerfile`
- **Port**: 80
- **Health Check**: HTTP GET /health
- **Purpose**: Serves React SPA with optimized Nginx configuration

### Backend (Fastify API)

- **Image**: Custom build from `./api-fastify/Dockerfile`
- **Port**: 4200
- **Health Check**: HTTP GET /api/v1/health
- **Purpose**: REST API with JWT authentication

### MongoDB

- **Image**: mongo:6.0
- **Port**: 27017
- **Volume**: `mongodb_data` (persistent)
- **Purpose**: Main database

### Redis

- **Image**: redis:7-alpine
- **Port**: 6379
- **Volume**: `redis_data` (persistent)
- **Purpose**: Caching and session storage

## Commands

### Start Services

```bash
# Start all services in background
docker-compose up -d

# Start specific service
docker-compose up -d backend

# Start with rebuild
docker-compose up -d --build
```

### Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes data)
docker-compose down -v

# Stop specific service
docker-compose stop backend
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Execute Commands

```bash
# Access backend container shell
docker-compose exec backend sh

# Access MongoDB shell
docker-compose exec mongodb mongosh -u admin -p <password>

# Run migrations
docker-compose exec backend pnpm run seed
```

### Restart Services

```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart backend
```

## Volumes

Persistent data is stored in Docker volumes:

- `mongodb_data`: MongoDB database files
- `mongodb_config`: MongoDB configuration
- `redis_data`: Redis persistence files
- `./api-fastify/uploads`: Uploaded files (bind mount)

### Backup Volumes

```bash
# Backup MongoDB
docker-compose exec mongodb mongodump --out=/backup
docker cp $(docker-compose ps -q mongodb):/backup ./backup-$(date +%Y%m%d)

# Backup uploaded files
tar -czf uploads-backup-$(date +%Y%m%d).tar.gz api-fastify/uploads/
```

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGO_ROOT_PASSWORD` | MongoDB root password | `secure_password_123` |
| `JWT_SECRET` | JWT signing secret | `random_string_here` |
| `DB_NAME` | Database name | `mern_blog` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Backend port | `4200` |
| `FRONTEND_PORT` | Frontend port | `80` |
| `REDIS_URL` | Redis connection URL | `redis://redis:6379` |
| `EMAIL_HOST` | SMTP server | - |
| `AI_API_KEY` | AI service API key | - |

## Production Deployment

### 1. Security Hardening

```bash
# Use secrets for sensitive data
docker secret create mongo_password ./mongo_password.txt
docker secret create jwt_secret ./jwt_secret.txt
```

### 2. Reverse Proxy (Nginx/Traefik)

Add SSL/TLS termination and domain routing:

```yaml
# docker-compose.prod.yml
services:
  frontend:
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.frontend.rule=Host(`yourdomain.com`)"
      - "traefik.http.routers.frontend.tls=true"
```

### 3. Resource Limits

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

### 4. Health Checks

All services include health checks. Monitor with:

```bash
docker-compose ps
# Look for "healthy" status
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs <service-name>

# Inspect container
docker-compose ps
docker inspect <container-id>
```

### MongoDB Connection Issues

```bash
# Test connection
docker-compose exec backend sh
mongosh "mongodb://admin:password@mongodb:27017/mern_blog?authSource=admin"
```

### Port Already in Use

```bash
# Change ports in .env
PORT=4201
FRONTEND_PORT=8080

# Or find and stop conflicting services
lsof -i :80
kill -9 <PID>
```

### Out of Disk Space

```bash
# Clean up Docker system
docker system prune -a --volumes

# Remove unused images
docker image prune -a

# Remove specific volumes
docker volume rm mern_blog_mongodb_data
```

### Network Issues

```bash
# Recreate network
docker-compose down
docker network prune
docker-compose up -d
```

## Development vs Production

### Development

```bash
# Use docker-compose.yml (default)
docker-compose up -d

# Hot reload enabled
# Debug logs enabled
# Exposed ports for debugging
```

### Production

```bash
# Use production compose file
docker-compose -f docker-compose.prod.yml up -d

# Optimized builds
# Security hardening
# Resource limits
# Health checks
```

## Monitoring

### Container Stats

```bash
# Real-time stats
docker stats

# Specific container
docker stats mern_blog_backend
```

### Health Checks

```bash
# Check all services
docker-compose ps

# Test health endpoints
curl http://localhost:4200/api/v1/health
curl http://localhost:80/health
```

## Scaling

### Horizontal Scaling

```bash
# Scale backend service
docker-compose up -d --scale backend=3

# Note: Requires load balancer configuration
```

### Vertical Scaling

Adjust resource limits in `docker-compose.yml`:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '4'
          memory: 4G
```

## CI/CD Integration

### GitHub Actions

The project includes CI/CD workflows that build and push Docker images on release tags.

See `.github/workflows/deploy.yml` for details.

### Manual Build and Push

```bash
# Build images
docker build -t myuser/mern-blog-frontend:latest .
docker build -t myuser/mern-blog-backend:latest ./api-fastify

# Push to registry
docker push myuser/mern-blog-frontend:latest
docker push myuser/mern-blog-backend:latest
```

## Best Practices

1. **Never commit `.env` file** - Use `.env.example` as template
2. **Use secrets for sensitive data** in production
3. **Regular backups** of MongoDB and uploads
4. **Monitor disk space** for logs and uploads
5. **Update images regularly** for security patches
6. **Use specific version tags** in production
7. **Implement log rotation** for production
8. **Set up monitoring** (Prometheus, Grafana)

## Support

For issues related to Docker deployment:

1. Check logs: `docker-compose logs -f`
2. Review this documentation
3. Check [GitHub Issues](https://github.com/johanPrise/MERN_chatai_blog/issues)
4. Create a new issue with:
   - Docker version
   - Docker Compose version
   - Error logs
   - Environment (OS, etc.)

---

**Last Updated**: December 2025
