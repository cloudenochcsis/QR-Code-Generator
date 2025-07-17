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

Access monitoring dashboards:

- **Grafana**: http://grafana.your-domain.com
- **Prometheus**: http://prometheus.your-domain.com
- **Application Metrics**: Available at `/metrics` endpoint

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
