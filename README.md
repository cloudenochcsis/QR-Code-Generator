# Multi-Cloud Microservices QR Code Generator

A production-ready DevOps portfolio project demonstrating containerized microservices with full automation, deployable on both AWS and Azure cloud platforms.

## Architecture Overview

This project showcases enterprise-level DevOps practices with:

- **Frontend**: Next.js application for QR code generation interface
- **Backend**: FastAPI service for QR code generation logic
- **Storage**: Multi-cloud storage solution (AWS S3 + Azure Blob Storage)
- **Orchestration**: Kubernetes (EKS on AWS, AKS on Azure)
- **Infrastructure**: Terraform for multi-cloud provisioning
- **CI/CD**: GitHub Actions with multi-cloud deployment
- **Monitoring**: Prometheus + Grafana stack

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ and npm/yarn
- Python 3.11+
- Terraform 1.5+
- kubectl
- AWS CLI and Azure CLI
- GitHub account for CI/CD

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd multi-cloud-qr-generator
   ```

2. **Start the backend service**
   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

3. **Start the frontend application**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Docker Development

```bash
# Build and run with Docker Compose
docker-compose up --build

# Access the application
# Frontend: http://localhost:3000
# Backend: http://localhost:8000
```

## Project Structure

```
qr-code-generator/
├── frontend/                 # Next.js frontend application
│   ├── src/                 # Source code
│   ├── Dockerfile           # Frontend container configuration
│   ├── package.json         # Node.js dependencies
│   └── next.config.js       # Next.js configuration
├── backend/                 # FastAPI backend service
│   ├── services/            # Business logic services
│   ├── Dockerfile           # Backend container configuration
│   ├── requirements.txt     # Python dependencies
│   └── main.py             # FastAPI application entry point
├── infrastructure/          # Infrastructure as Code
│   ├── terraform/           # Terraform configurations
│   │   ├── aws/            # AWS-specific resources
│   │   ├── azure/          # Azure-specific resources
│   │   └── modules/        # Reusable Terraform modules
│   └── kubernetes/         # Kubernetes manifests
│       ├── aws/            # EKS-specific configurations
│       ├── azure/          # AKS-specific configurations
│       └── monitoring/     # Monitoring stack
├── .github/                # GitHub Actions workflows
│   └── workflows/          # CI/CD pipeline definitions
├── docs/                   # Project documentation
└── README.md              # This file
```

## Multi-Cloud Deployment

### AWS Deployment

1. **Configure AWS credentials**
   ```bash
   aws configure
   ```

2. **Deploy infrastructure**
   ```bash
   cd infrastructure/terraform/aws
   terraform init
   terraform plan
   terraform apply
   ```

3. **Deploy applications**
   ```bash
   kubectl apply -f infrastructure/kubernetes/aws/
   ```

### Azure Deployment

1. **Configure Azure credentials**
   ```bash
   az login
   ```

2. **Deploy infrastructure**
   ```bash
   cd infrastructure/terraform/azure
   terraform init
   terraform plan
   terraform apply
   ```

3. **Deploy applications**
   ```bash
   kubectl apply -f infrastructure/kubernetes/azure/
   ```

## Features

### Frontend Features
- Modern, responsive QR code generator interface
- Real-time QR code preview
- Batch QR code generation from file upload
- Download generated QR codes (PNG, SVG, PDF)
- Form validation and error handling
- Loading states and user feedback
- Dark/light theme support

### Backend Features
- RESTful API for QR code generation
- Support for various QR code types (URL, text, WiFi, etc.)
- Multi-cloud storage integration
- Health check endpoints for Kubernetes
- Prometheus metrics endpoints
- Request logging and error handling
- OpenAPI/Swagger documentation
- Async request handling

### DevOps Features
- Multi-cloud infrastructure provisioning
- Container orchestration with Kubernetes
- Automated CI/CD pipelines
- Security scanning and vulnerability assessment
- Horizontal pod autoscaling
- Rolling deployments with zero downtime
- Comprehensive monitoring and alerting
- Infrastructure as Code (100% Terraform managed)

## Monitoring

This project includes comprehensive monitoring with Prometheus and Grafana, providing real-time insights into application performance, infrastructure health, and business metrics.

### Quick Start (Local Development)

```bash
# Start the full stack with monitoring
docker-compose up -d

# Access monitoring dashboards
# Grafana: http://localhost:3001 (admin/admin)
# Prometheus: http://localhost:9090
# Application Metrics: http://localhost:8000/metrics
```

### Production Deployment

#### 1. Kubernetes Deployment (Recommended)

```bash
# Add Helm repositories
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

# Deploy Prometheus Stack (includes Grafana)
helm upgrade --install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false \
  --set prometheus.prometheusSpec.podMonitorSelectorNilUsesHelmValues=false \
  --wait

# Deploy custom dashboards and alerts
kubectl apply -f infrastructure/monitoring/ -n monitoring

# Get Grafana admin password
kubectl get secret --namespace monitoring prometheus-grafana \
  -o jsonpath="{.data.admin-password}" | base64 --decode
```

#### 2. Docker Compose Deployment

```bash
# Deploy full stack including monitoring
docker-compose up -d

# Or deploy only monitoring services
docker-compose up -d prometheus grafana

# Access dashboards
# Grafana: http://your-domain:3001
# Prometheus: http://your-domain:9090
```

### Available Dashboards

#### 1. QR Generator Application Dashboard
- **QR Code Generation Metrics**: Rate, volume, success/failure rates
- **API Performance**: Request rate, response times, error rates
- **Storage Metrics**: Upload success rates for AWS S3 and Azure Blob
- **Resource Usage**: CPU, memory, and disk utilization

#### 2. Infrastructure Dashboard
- **Kubernetes Cluster Health**: Node status, pod health, resource usage
- **Network Metrics**: Ingress/egress traffic, connection counts
- **Storage Performance**: I/O metrics, latency, throughput

#### 3. Business Metrics Dashboard
- **Usage Analytics**: Daily/weekly QR code generation trends
- **User Behavior**: Popular formats, batch vs single generation
- **Cost Optimization**: Resource utilization vs demand patterns

### Key Metrics Monitored

#### Application Metrics (Exposed at `/metrics`)

**QR Code Generation Metrics:**
```
# Total QR codes generated
qr_codes_generated_total

# QR code generation duration
qr_generation_duration_seconds_bucket
qr_generation_duration_seconds_count
qr_generation_duration_seconds_sum
```

**HTTP Request Metrics:**
```
# Total HTTP requests (auto-instrumented by FastAPI)
http_requests_total{method, handler, status}

# HTTP request duration
http_request_duration_seconds_bucket{method, handler}
http_request_duration_seconds_count{method, handler}
http_request_duration_seconds_sum{method, handler}

# HTTP requests in progress
http_requests_inprogress{method, handler}
```

**Storage Operation Metrics:**
```
# Total storage uploads by provider
storage_uploads_total{provider="aws"}
storage_uploads_total{provider="azure"}

# Storage upload duration by provider
storage_upload_duration_seconds_bucket{provider}
storage_upload_duration_seconds_count{provider}
storage_upload_duration_seconds_sum{provider}
```

**System Metrics:**
```
# Process metrics
process_cpu_seconds_total
process_resident_memory_bytes
process_virtual_memory_bytes
process_open_fds

# Python GC metrics
python_gc_objects_collected_total
python_gc_collections_total
```

#### Infrastructure Metrics
```
# Container metrics
container_cpu_usage_seconds_total
container_memory_usage_bytes

# Kubernetes metrics
kube_pod_status_ready
kube_deployment_status_replicas

# Node metrics
node_cpu_seconds_total
node_memory_MemAvailable_bytes
```

### Alerting Rules

The monitoring stack includes pre-configured alerts for:

#### Critical Alerts
- **Application Down**: Service unavailable for >1 minute
- **High Error Rate**: >10% error rate for >5 minutes
- **Storage Failures**: Upload failure rate >5% for >5 minutes

#### Warning Alerts
- **High Latency**: 95th percentile >2 seconds for >5 minutes
- **Resource Usage**: CPU >80% or Memory >85% for >10 minutes
- **Pod Issues**: Crash looping or not ready for >10 minutes

#### Business Alerts
- **Low Volume**: QR generation <10/hour for >30 minutes
- **High Volume**: Unusual spike >100/second for >5 minutes
- **Storage Quota**: >80% of storage quota used

### Custom Configuration

#### Environment Variables
```bash
# Monitoring configuration
PROMETHEUS_PORT=9090
GRAFANA_PORT=3001
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=your_secure_password

# Enable/disable monitoring
ENABLE_MONITORING=true
```

#### Adding Custom Metrics

1. **Backend Metrics** (FastAPI):
```python
from prometheus_client import Counter, Histogram

# Custom counter
custom_operations = Counter('custom_operations_total', 'Custom operations')

# Custom histogram
custom_duration = Histogram('custom_operation_duration_seconds', 'Custom operation duration')
```

2. **Frontend Metrics** (Next.js):
```javascript
// Add to your API routes
import { register, collectDefaultMetrics } from 'prom-client';

collectDefaultMetrics();
```

### Accessing Dashboards

#### Local Development
- **Grafana**: http://localhost:3001
  - Username: `admin`
  - Password: `admin`
- **Prometheus**: http://localhost:9090

#### Production (Kubernetes)
```bash
# Port forward Grafana
kubectl port-forward -n monitoring svc/prometheus-grafana 3001:80

# Port forward Prometheus
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090

# Access via ingress (if configured)
# Grafana: https://grafana.your-domain.com
# Prometheus: https://prometheus.your-domain.com
```

### Testing the Monitoring Setup

#### 1. Verify Metrics Collection
```bash
# Test application metrics endpoint
curl http://localhost:8000/metrics

# Generate some QR codes to create metrics
curl -X POST http://localhost:8000/generate \
  -H "Content-Type: application/json" \
  -d '{"data": "test", "format": "PNG"}'

# Check metrics again to see counters increment
curl http://localhost:8000/metrics | grep qr_codes_generated_total
```

#### 2. Verify Prometheus Scraping
```bash
# Access Prometheus UI
open http://localhost:9090

# Check targets status: Status > Targets
# Query metrics: Graph > Enter query: qr_codes_generated_total
```

#### 3. Verify Grafana Dashboards
```bash
# Access Grafana UI
open http://localhost:3001

# Login with admin/admin
# Navigate to Dashboards > QR Generator Application Dashboard
```

#### 4. Test Alerting
```bash
# Simulate high error rate (if backend supports it)
for i in {1..10}; do
  curl -X POST http://localhost:8000/generate \
    -H "Content-Type: application/json" \
    -d '{"data": "", "format": "PNG"}' || true
done

# Check alerts in Prometheus: Alerts tab
# Check alert notifications in Grafana: Alerting > Alert Rules
```

### Troubleshooting

#### Common Issues

1. **Metrics not appearing**:
```bash
# Check if metrics endpoint is accessible
curl http://localhost:8000/metrics

# Verify Prometheus targets
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090
# Visit http://localhost:9090/targets
```

2. **Grafana dashboard not loading**:
```bash
# Check Grafana logs
kubectl logs -n monitoring deployment/prometheus-grafana

# Verify data source configuration
# Grafana > Configuration > Data Sources > Prometheus
```

3. **Alerts not firing**:
```bash
# Check alert rules
kubectl get prometheusrules -n monitoring

# View alert status in Prometheus
# http://localhost:9090/alerts
```

4. **Docker Compose issues**:
```bash
# Check service logs
docker-compose logs prometheus
docker-compose logs grafana

# Restart monitoring services
docker-compose restart prometheus grafana
```

### Configuration Files

The monitoring setup includes several pre-configured files:

```
infrastructure/monitoring/
├── prometheus.yml              # Prometheus configuration
├── alert_rules.yml            # Alert rules and thresholds
├── grafana/
│   ├── provisioning/
│   │   ├── dashboards/        # Dashboard provisioning
│   │   └── datasources/       # Data source configuration
│   └── dashboards/
│       ├── qr-generator-dashboard.json    # Application dashboard
│       ├── infrastructure-dashboard.json  # Infrastructure dashboard
│       └── business-dashboard.json        # Business metrics dashboard
└── kubernetes/
    ├── prometheus-config.yaml  # Kubernetes ConfigMap
    ├── grafana-config.yaml     # Grafana configuration
    └── service-monitors.yaml   # ServiceMonitor definitions
```

### Performance Optimization

#### Retention Policies
```yaml
# Prometheus configuration
prometheus:
  prometheusSpec:
    retention: 30d
    retentionSize: 50GB
```

#### Resource Limits
```yaml
# Kubernetes resource limits
resources:
  limits:
    cpu: 2000m
    memory: 4Gi
  requests:
    cpu: 500m
    memory: 1Gi
```

## Security

- Container image vulnerability scanning
- Kubernetes RBAC implementation
- Network policies and security groups
- Secrets management with Kubernetes Secrets
- Least privilege access principles
- Regular security updates and patches

## Testing

```bash
# Run backend tests
cd backend
pytest

# Run frontend tests
cd frontend
npm test

# Run integration tests
npm run test:integration

# Run security scans
npm audit
safety check
```

## Documentation

- [Architecture Documentation](docs/architecture.md)
- [Deployment Guide](docs/deployment.md)
- [API Documentation](http://localhost:8000/docs)
- [Monitoring Guide](docs/monitoring.md)
- [Troubleshooting](docs/troubleshooting.md)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
