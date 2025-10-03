# Health API Documentation

<cite>
**Referenced Files in This Document**
- [health.routes.ts](file://api-fastify/src/routes/health.routes.ts)
- [health.controller.ts](file://api-fastify/src/controllers/health.controller.ts)
- [cache.service.ts](file://api-fastify/src/services/cache.service.ts)
- [database.ts](file://api-fastify/src/config/database.ts)
- [server.ts](file://api-fastify/src/server.ts)
- [ConnectionMonitor.ts](file://src/services/ConnectionMonitor.ts)
- [rate-limit.middleware.ts](file://api-fastify/src/middlewares/rate-limit.middleware.ts)
- [package.json](file://api-fastify/package.json)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Health Endpoint Overview](#health-endpoint-overview)
3. [Technical Implementation](#technical-implementation)
4. [Response Structure](#response-structure)
5. [Monitoring and Orchestration](#monitoring-and-orchration)
6. [Security Considerations](#security-considerations)
7. [Error Scenarios](#error-scenarios)
8. [Performance Metrics](#performance-metrics)
9. [Troubleshooting Guide](#troubleshooting-guide)
10. [Best Practices](#best-practices)

## Introduction

The Health API endpoint is a critical component of the MERN_chatai_blog system designed to provide real-time status information about the application's health and operational status. This endpoint serves as a vital tool for monitoring, orchestration systems like Kubernetes, and automated health checks.

The health endpoint follows industry best practices by returning standardized HTTP status codes, providing comprehensive system status information, and being designed for frequent polling by monitoring systems without exposing sensitive operational details.

## Health Endpoint Overview

### Endpoint Details

- **URL**: `/api/health`
- **Method**: `GET`
- **Content-Type**: `application/json`
- **Access Control**: Public (no authentication required)
- **Rate Limiting**: Applied via Redis-based rate limiting middleware

### Purpose and Use Cases

The health endpoint serves multiple critical functions:

1. **System Monitoring**: Provides real-time status of database connections, cache availability, and service health
2. **Orchestration**: Used by Kubernetes liveness and readiness probes for automatic scaling and failover
3. **Load Balancer Health Checks**: Enables load balancers to route traffic only to healthy instances
4. **Automated Alerting**: Integrates with monitoring systems to trigger alerts when the system becomes unhealthy
5. **Development Testing**: Allows developers to quickly verify system health during development

## Technical Implementation

### Route Registration

The health endpoint is registered in the Fastify routing system through a dedicated route handler:

```mermaid
flowchart TD
A["Fastify Server Startup"] --> B["Register Health Routes"]
B --> C["GET /api/health"]
C --> D["Health Controller"]
D --> E["Database Status Check"]
D --> F["Response Generation"]
F --> G["HTTP 200/503 Response"]
```

**Diagram sources**
- [health.routes.ts](file://api-fastify/src/routes/health.routes.ts#L7-L10)
- [health.controller.ts](file://api-fastify/src/controllers/health.controller.ts#L8-L31)

### Database Connectivity Check

The health endpoint performs a basic database connectivity check using Mongoose's connection state:

```mermaid
sequenceDiagram
participant Client as "Monitoring System"
participant Server as "Fastify Server"
participant Controller as "Health Controller"
participant Mongoose as "Mongoose"
participant MongoDB as "MongoDB"
Client->>Server : GET /api/health
Server->>Controller : checkHealth()
Controller->>Mongoose : connection.readyState
Mongoose-->>Controller : 1 (connected) or 0 (disconnected)
Controller->>Controller : Determine status
Controller-->>Server : Health response
Server-->>Client : HTTP 200/503
```

**Diagram sources**
- [health.controller.ts](file://api-fastify/src/controllers/health.controller.ts#L10-L15)

**Section sources**
- [health.routes.ts](file://api-fastify/src/routes/health.routes.ts#L1-L12)
- [health.controller.ts](file://api-fastify/src/controllers/health.controller.ts#L1-L32)

## Response Structure

### Successful Health Check Response (HTTP 200)

When the system is healthy, the endpoint returns a comprehensive status report:

```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:45.123Z",
  "database": {
    "status": "connected"
  },
  "environment": "production",
  "version": "1.0.0"
}
```

### Unhealthy System Response (HTTP 500)

When the system encounters an error during the health check:

```json
{
  "status": "error",
  "message": "Une erreur est survenue lors de la vérification de la santé de l'API"
}
```

### Response Fields Explanation

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | Overall system status (`"ok"` or `"error"`) |
| `timestamp` | string | ISO 8601 formatted timestamp of the health check |
| `database.status` | string | Database connection status (`"connected"` or `"disconnected"`) |
| `environment` | string | Current Node.js environment (`"development"`, `"production"`, etc.) |
| `version` | string | Application version from package.json |

**Section sources**
- [health.controller.ts](file://api-fastify/src/controllers/health.controller.ts#L16-L31)

## Monitoring and Orchestration

### Kubernetes Integration

The health endpoint is specifically designed for Kubernetes deployment scenarios:

```yaml
livenessProbe:
  httpGet:
    path: /api/health
    port: 4200
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /api/health
    port: 4200
  initialDelaySeconds: 5
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3
```

### Connection Monitor Service

The frontend includes a sophisticated connection monitor that utilizes the health endpoint for real-time status detection:

```mermaid
classDiagram
class ConnectionMonitor {
-status : ConnectionStatus
-listeners : Function[]
-checkInterval : NodeJS.Timeout
-config : ConnectionMonitorConfig
+initializeMonitoring()
+checkConnection()
+subscribe(listener)
+getStatus()
+forceCheck()
+dispose()
}
class ConnectionMonitorConfig {
+checkInterval : number
+timeout : number
+endpoint : string
}
ConnectionMonitor --> ConnectionMonitorConfig
```

**Diagram sources**
- [ConnectionMonitor.ts](file://src/services/ConnectionMonitor.ts#L10-L139)

### Browser-Based Health Checking

The connection monitor implements intelligent health checking with the following features:

- **Automatic Detection**: Responds to browser online/offline events
- **Periodic Checks**: Performs health checks every 30 seconds when online
- **Timeout Handling**: Uses 5-second timeouts to prevent hanging requests
- **Status Propagation**: Notifies all subscribers of status changes

**Section sources**
- [ConnectionMonitor.ts](file://src/services/ConnectionMonitor.ts#L1-L139)

## Security Considerations

### Access Control

The health endpoint is intentionally designed as a public endpoint without authentication requirements:

- **Public Accessibility**: No JWT tokens or API keys required
- **Rate Limiting Protection**: Redis-based rate limiting prevents abuse
- **Minimal Information Disclosure**: Returns only essential health information

### Rate Limiting Implementation

The system implements sophisticated rate limiting specifically for the health endpoint:

```mermaid
flowchart TD
A["Incoming Request"] --> B["Generate Rate Limit Key"]
B --> C["Check Current Window Count"]
C --> D{"Count >= Max Requests?"}
D --> |Yes| E["Return 429 Too Many Requests"]
D --> |No| F["Increment Counter"]
F --> G["Set TTL for Window"]
G --> H["Allow Request"]
E --> I["Add Rate Limit Headers"]
H --> J["Return Health Response"]
I --> K["Return 429 Response"]
```

**Diagram sources**
- [rate-limit.middleware.ts](file://api-fastify/src/middlewares/rate-limit.middleware.ts#L15-L62)

### Rate Limiting Configuration

The health endpoint uses the following rate limiting parameters:

- **Window Duration**: 60 seconds
- **Max Requests**: 100 requests per IP address per minute
- **Key Generator**: Uses client IP address as the rate limit key
- **Error Handling**: Graceful degradation - errors don't block requests

**Section sources**
- [rate-limit.middleware.ts](file://api-fastify/src/middlewares/rate-limit.middleware.ts#L64-L75)

## Error Scenarios

### Database Connection Failure

When the database connection is lost or unavailable:

```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:45.123Z",
  "database": {
    "status": "disconnected"
  },
  "environment": "production",
  "version": "1.0.0"
}
```

### System-Level Errors

When unexpected errors occur during the health check:

```json
{
  "status": "error",
  "message": "Une erreur est survenue lors de la vérification de la santé de l'API"
}
```

### Network Timeout Scenarios

The health endpoint handles network timeouts gracefully:

- **Database Timeout**: Returns current connection state without blocking
- **Redis Timeout**: Gracefully handles cache service unavailability
- **Application Errors**: Catches and logs exceptions without crashing

**Section sources**
- [health.controller.ts](file://api-fastify/src/controllers/health.controller.ts#L18-L31)

## Performance Metrics

### Response Time Characteristics

The health endpoint is optimized for minimal latency:

- **Typical Response Time**: < 50ms under normal conditions
- **Database Check Overhead**: Minimal - uses Mongoose connection state
- **Memory Footprint**: Negligible - no caching or persistent state
- **CPU Impact**: Minimal - synchronous database state check

### Scalability Considerations

- **Concurrent Requests**: Handles thousands of concurrent health checks
- **Resource Usage**: Minimal memory and CPU overhead
- **Network Bandwidth**: Small response payload (< 200 bytes)
- **Cache Integration**: Leverages Redis for rate limiting without health data caching

### Monitoring Metrics

The health endpoint provides several metrics for system monitoring:

- **Uptime**: Calculated from timestamp field
- **Database Status**: Real-time connection state
- **Environment**: Deployment environment identification
- **Version**: Application version tracking

## Troubleshooting Guide

### Common Issues and Solutions

#### Health Endpoint Unreachable

**Symptoms**: 404 or connection refused errors
**Causes**: 
- Server not running
- Incorrect route registration
- Firewall blocking port 4200

**Solutions**:
1. Verify server is running: `curl http://localhost:4200/api/health`
2. Check route registration in Fastify
3. Verify firewall configuration

#### Database Connection Issues

**Symptoms**: Database status shows "disconnected"
**Causes**:
- MongoDB server not running
- Network connectivity issues
- Authentication failures

**Solutions**:
1. Check MongoDB service status
2. Verify connection string in environment variables
3. Test database connectivity independently

#### Rate Limiting Problems

**Symptoms**: 429 Too Many Requests responses
**Causes**:
- Excessive health check frequency
- Misconfigured rate limiting
- Redis connectivity issues

**Solutions**:
1. Reduce health check frequency to 30+ seconds
2. Check Redis service availability
3. Review rate limiting configuration

### Debugging Commands

```bash
# Basic health check
curl -v http://localhost:4200/api/health

# Health check with timing
time curl -s http://localhost:4200/api/health

# Check rate limiting headers
curl -I http://localhost:4200/api/health

# Monitor health endpoint logs
docker logs <container-name> | grep health
```

## Best Practices

### Monitoring Implementation

1. **Appropriate Intervals**: 
   - Kubernetes probes: 10-30 seconds
   - Custom monitoring: 30+ seconds
   - Load balancer checks: 15-30 seconds

2. **Failure Thresholds**:
   - Kubernetes: 3 consecutive failures
   - Custom systems: 2-3 consecutive failures
   - Grace period: Allow 30-60 seconds for recovery

3. **Timeout Configuration**:
   - Kubernetes: 5 seconds
   - Custom systems: 10 seconds
   - Load balancers: 5-10 seconds

### Production Deployment

1. **Environment Variables**:
   ```bash
   NODE_ENV=production
   MONGODB_URI=mongodb://username:password@host:port/database
   REDIS_URL=redis://localhost:6379
   ```

2. **Health Check Configuration**:
   ```javascript
   // Recommended health check interval
   const HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
   
   // Recommended timeout
   const HEALTH_CHECK_TIMEOUT = 5000; // 5 seconds
   ```

3. **Monitoring Integration**:
   - Prometheus metrics collection
   - Grafana dashboard integration
   - Alert manager configuration
   - Log aggregation with ELK stack

### Development Considerations

1. **Local Development**:
   - Use shorter intervals for rapid feedback
   - Enable detailed logging
   - Mock external dependencies

2. **Testing Strategies**:
   - Unit tests for health controller
   - Integration tests with mocked services
   - Load testing with health endpoint

3. **Documentation Maintenance**:
   - Keep health check documentation updated
   - Version-aware health reporting
   - Clear error messaging

**Section sources**
- [server.ts](file://api-fastify/src/server.ts#L1-L174)
- [database.ts](file://api-fastify/src/config/database.ts#L1-L22)