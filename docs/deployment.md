# Deployment Guide - Multi-Cloud QR Code Generator

## Prerequisites

### Required Tools
- **Docker**: Version 20.10 or later
- **kubectl**: Version 1.28 or later
- **Terraform**: Version 1.5 or later
- **Helm**: Version 3.13 or later
- **AWS CLI**: Version 2.x (for AWS deployment)
- **Azure CLI**: Version 2.x (for Azure deployment)
- **Git**: Version 2.x

### Cloud Account Setup

#### AWS Account Requirements
- AWS account with appropriate permissions
- IAM user with programmatic access
- Required IAM permissions:
  - EC2, EKS, S3, VPC, Route53, CloudWatch
  - IAM role creation and management
  - Load Balancer and Auto Scaling permissions

#### Azure Account Requirements
- Azure subscription with contributor access
- Service Principal for Terraform
- Required permissions:
  - Resource Group management
  - AKS, Storage Account, Virtual Network
  - Application Gateway and DNS Zone management

## Local Development Setup

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/multi-cloud-qr-generator.git
cd multi-cloud-qr-generator
```

### 2. Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
vim .env
```

Required environment variables:
```bash
# AWS Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=qr-codes-bucket

# Azure Configuration
AZURE_STORAGE_ACCOUNT=your_storage_account
AZURE_STORAGE_CONNECTION_STRING=your_connection_string
AZURE_CONTAINER=qr-codes

# Application Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Local Development with Docker Compose
```bash
# Build and start all services
docker-compose up --build

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Documentation: http://localhost:8000/docs
# Prometheus: http://localhost:9090
# Grafana: http://localhost:3001 (admin/admin)
```

## AWS Deployment

### 1. Infrastructure Deployment

#### Setup Terraform Backend
```bash
# Create S3 bucket for Terraform state
aws s3 mb s3://qr-generator-terraform-state --region us-east-1

# Create DynamoDB table for state locking
aws dynamodb create-table \
  --table-name qr-generator-terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --region us-east-1
```

#### Deploy Infrastructure
```bash
cd infrastructure/terraform/aws

# Initialize Terraform
terraform init

# Plan deployment
terraform plan -var="environment=prod" -out=tfplan

# Apply infrastructure
terraform apply tfplan
```

### 2. Application Deployment

#### Configure kubectl
```bash
# Update kubeconfig
aws eks update-kubeconfig --region us-east-1 --name qr-generator-prod
```

#### Deploy Application
```bash
# Create namespace
kubectl apply -f infrastructure/kubernetes/aws/namespace.yaml

# Create secrets (replace with actual values)
kubectl create secret generic qr-generator-secrets \
  --from-literal=AWS_ACCESS_KEY_ID="$AWS_ACCESS_KEY_ID" \
  --from-literal=AWS_SECRET_ACCESS_KEY="$AWS_SECRET_ACCESS_KEY" \
  --from-literal=AZURE_STORAGE_ACCOUNT="$AZURE_STORAGE_ACCOUNT" \
  --from-literal=AZURE_STORAGE_CONNECTION_STRING="$AZURE_STORAGE_CONNECTION_STRING" \
  --namespace=qr-generator

# Apply configurations
kubectl apply -f infrastructure/kubernetes/aws/configmap.yaml
kubectl apply -f infrastructure/kubernetes/aws/secrets.yaml

# Deploy applications
kubectl apply -f infrastructure/kubernetes/aws/backend-deployment.yaml
kubectl apply -f infrastructure/kubernetes/aws/frontend-deployment.yaml

# Configure ingress
kubectl apply -f infrastructure/kubernetes/aws/ingress.yaml

# Setup autoscaling
kubectl apply -f infrastructure/kubernetes/aws/hpa.yaml
```

### 3. Monitoring Setup
```bash
# Add Helm repositories
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

# Install Prometheus
helm upgrade --install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false \
  --wait

# Deploy custom dashboards
kubectl apply -f infrastructure/monitoring/ -n monitoring
```

## Azure Deployment

### 1. Infrastructure Deployment

#### Setup Azure Backend
```bash
# Create resource group for Terraform state
az group create --name qr-generator-terraform-state --location eastus

# Create storage account
az storage account create \
  --resource-group qr-generator-terraform-state \
  --name qrgenterraformstate \
  --sku Standard_LRS \
  --encryption-services blob

# Create container
az storage container create \
  --name tfstate \
  --account-name qrgenterraformstate
```

#### Deploy Infrastructure
```bash
cd infrastructure/terraform/azure

# Login to Azure
az login

# Initialize Terraform
terraform init

# Plan deployment
terraform plan -var="environment=prod" -out=tfplan

# Apply infrastructure
terraform apply tfplan
```

### 2. Application Deployment

#### Configure kubectl
```bash
# Get AKS credentials
az aks get-credentials --resource-group qr-generator-prod-rg --name qr-generator-prod-aks
```

#### Deploy Application
```bash
# Create namespace
kubectl apply -f infrastructure/kubernetes/azure/namespace.yaml

# Create secrets
kubectl create secret generic qr-generator-secrets \
  --from-literal=AZURE_STORAGE_ACCOUNT="$AZURE_STORAGE_ACCOUNT" \
  --from-literal=AZURE_STORAGE_CONNECTION_STRING="$AZURE_STORAGE_CONNECTION_STRING" \
  --from-literal=AWS_ACCESS_KEY_ID="$AWS_ACCESS_KEY_ID" \
  --from-literal=AWS_SECRET_ACCESS_KEY="$AWS_SECRET_ACCESS_KEY" \
  --namespace=qr-generator

# Apply configurations and deploy
kubectl apply -f infrastructure/kubernetes/azure/configmap.yaml
kubectl apply -f infrastructure/kubernetes/azure/secrets.yaml
kubectl apply -f infrastructure/kubernetes/azure/backend-deployment.yaml
kubectl apply -f infrastructure/kubernetes/azure/frontend-deployment.yaml
kubectl apply -f infrastructure/kubernetes/azure/ingress.yaml
kubectl apply -f infrastructure/kubernetes/azure/hpa.yaml
```

## CI/CD Pipeline Setup

### 1. GitHub Repository Setup
```bash
# Fork or create repository
# Add the following secrets in GitHub repository settings:

# AWS Secrets
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY

# Azure Secrets
AZURE_CREDENTIALS  # JSON format service principal

# Application Secrets
AZURE_STORAGE_ACCOUNT
AZURE_STORAGE_CONNECTION_STRING
NEXT_PUBLIC_API_URL
```

### 2. GitHub Actions Configuration
The repository includes three main workflows:

- **build-test.yml**: Runs on every push/PR
- **aws-deploy.yml**: Deploys to AWS on main branch
- **azure-deploy.yml**: Deploys to Azure on main branch

### 3. Manual Deployment Trigger
```bash
# Trigger deployment via GitHub CLI
gh workflow run aws-deploy.yml --ref main
gh workflow run azure-deploy.yml --ref main
```

## Verification and Testing

### 1. Health Checks
```bash
# Check pod status
kubectl get pods -n qr-generator

# Check services
kubectl get services -n qr-generator

# Check ingress
kubectl get ingress -n qr-generator

# Test health endpoints
curl -f https://your-domain.com/health
curl -f https://api.your-domain.com/health
```

### 2. Functional Testing
```bash
# Test QR generation
curl -X POST https://api.your-domain.com/qr/generate \
  -H "Content-Type: application/json" \
  -d '{"data": "test", "format": "PNG"}'

# Test batch generation
curl -X POST https://api.your-domain.com/qr/batch \
  -H "Content-Type: application/json" \
  -d '{"items": ["test1", "test2"], "format": "PNG"}'
```

### 3. Performance Testing
```bash
# Install k6 for load testing
brew install k6  # macOS
# or
sudo apt-get install k6  # Ubuntu

# Run load test
k6 run scripts/load-test.js
```

## Monitoring and Observability

### 1. Access Monitoring Dashboards
- **Grafana**: https://grafana.your-domain.com
- **Prometheus**: https://prometheus.your-domain.com
- **Application Logs**: Check cloud provider logging services

### 2. Key Metrics to Monitor
- QR generation rate
- API response times
- Error rates
- Resource utilization
- Storage usage

### 3. Alerting Setup
Alerts are automatically configured for:
- Application downtime
- High error rates
- Performance degradation
- Resource exhaustion

## Troubleshooting

### Common Issues

#### 1. Pod Startup Issues
```bash
# Check pod logs
kubectl logs -f deployment/qr-generator-backend -n qr-generator

# Check events
kubectl get events -n qr-generator --sort-by='.lastTimestamp'

# Check resource constraints
kubectl describe pod <pod-name> -n qr-generator
```

#### 2. Storage Access Issues
```bash
# Verify secrets
kubectl get secrets -n qr-generator
kubectl describe secret qr-generator-secrets -n qr-generator

# Test storage connectivity
kubectl exec -it <backend-pod> -n qr-generator -- python -c "
import boto3
s3 = boto3.client('s3')
print(s3.list_buckets())
"
```

#### 3. Ingress Issues
```bash
# Check ingress status
kubectl describe ingress qr-generator-ingress -n qr-generator

# Check load balancer
kubectl get services -n kube-system

# Verify DNS resolution
nslookup your-domain.com
```

### Recovery Procedures

#### 1. Application Rollback
```bash
# Rollback to previous version
kubectl rollout undo deployment/qr-generator-backend -n qr-generator
kubectl rollout undo deployment/qr-generator-frontend -n qr-generator

# Check rollout status
kubectl rollout status deployment/qr-generator-backend -n qr-generator
```

#### 2. Infrastructure Recovery
```bash
# Terraform state recovery
terraform import aws_eks_cluster.main qr-generator-prod

# Manual resource recreation
terraform plan -replace="aws_instance.example"
terraform apply
```

## Maintenance

### 1. Regular Updates
- Update container images monthly
- Apply security patches immediately
- Review and update dependencies quarterly

### 2. Backup Verification
- Test backup restoration monthly
- Verify cross-cloud replication weekly
- Document recovery procedures

### 3. Performance Optimization
- Review resource utilization monthly
- Optimize costs quarterly
- Update scaling policies based on usage patterns

This deployment guide provides comprehensive instructions for deploying and maintaining the Multi-Cloud QR Code Generator across both AWS and Azure platforms.
