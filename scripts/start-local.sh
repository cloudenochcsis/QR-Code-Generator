#!/bin/bash

# Multi-Cloud QR Code Generator - Local Development Startup Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command_exists docker; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command_exists docker-compose; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if Docker is running
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    
    print_success "All prerequisites are met!"
}

# Setup environment
setup_environment() {
    print_status "Setting up environment..."
    
    # Create .env file if it doesn't exist
    if [ ! -f .env ]; then
        print_warning ".env file not found. Creating from template..."
        cp .env.example .env
        print_warning "Please edit .env file with your actual configuration values."
        print_warning "For local development, you can leave cloud credentials empty."
    fi
    
    # Create necessary directories
    mkdir -p backend/logs
    mkdir -p infrastructure/monitoring/grafana/provisioning/datasources
    mkdir -p infrastructure/monitoring/grafana/provisioning/dashboards
    
    print_success "Environment setup complete!"
}

# Setup Grafana provisioning
setup_grafana() {
    print_status "Setting up Grafana provisioning..."
    
    # Create datasource configuration
    cat > infrastructure/monitoring/grafana/provisioning/datasources/prometheus.yml << EOF
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: true
EOF

    # Create dashboard provisioning
    cat > infrastructure/monitoring/grafana/provisioning/dashboards/dashboard.yml << EOF
apiVersion: 1

providers:
  - name: 'default'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUiUpdates: true
    options:
      path: /var/lib/grafana/dashboards
EOF

    print_success "Grafana provisioning setup complete!"
}

# Start services
start_services() {
    print_status "Starting services with Docker Compose..."
    
    # Build and start core services (without nginx for development)
    docker-compose up --build -d backend frontend prometheus grafana redis
    
    print_status "Waiting for services to be healthy..."
    
    # Wait for backend to be healthy
    print_status "Waiting for backend to be ready..."
    timeout 120 bash -c 'until curl -f http://localhost:8000/health/live >/dev/null 2>&1; do sleep 2; done' || {
        print_error "Backend failed to start within 120 seconds"
        docker-compose logs backend
        exit 1
    }
    
    # Wait for frontend to be ready
    print_status "Waiting for frontend to be ready..."
    timeout 120 bash -c 'until curl -f http://localhost:3000/api/health >/dev/null 2>&1; do sleep 2; done' || {
        print_error "Frontend failed to start within 120 seconds"
        docker-compose logs frontend
        exit 1
    }
    
    print_success "All services are running!"
}

# Display service information
show_services() {
    print_success "🎉 Multi-Cloud QR Code Generator is running!"
    echo ""
    echo "📱 Application URLs:"
    echo "   Frontend:      http://localhost:3000"
    echo "   Backend API:   http://localhost:8000"
    echo "   API Docs:      http://localhost:8000/docs"
    echo "   Health Check:  http://localhost:8000/health"
    echo ""
    echo "📊 Monitoring URLs:"
    echo "   Prometheus:    http://localhost:9090"
    echo "   Grafana:       http://localhost:3001 (admin/admin)"
    echo ""
    echo "🔧 Development Tools:"
    echo "   Redis:         localhost:6379"
    echo ""
    echo "📋 Useful Commands:"
    echo "   View logs:     docker-compose logs -f [service]"
    echo "   Stop all:      docker-compose down"
    echo "   Restart:       docker-compose restart [service]"
    echo "   Shell access:  docker-compose exec [service] /bin/bash"
    echo ""
    echo "🚀 Happy coding!"
}

# Main execution
main() {
    echo "🛠️  Multi-Cloud QR Code Generator - Local Development Setup"
    echo "=========================================================="
    echo ""
    
    check_prerequisites
    setup_environment
    setup_grafana
    start_services
    show_services
}

# Handle script arguments
case "${1:-}" in
    "stop")
        print_status "Stopping all services..."
        docker-compose down
        print_success "All services stopped!"
        ;;
    "restart")
        print_status "Restarting services..."
        docker-compose restart
        print_success "Services restarted!"
        ;;
    "logs")
        docker-compose logs -f "${2:-}"
        ;;
    "clean")
        print_warning "This will remove all containers, volumes, and images. Are you sure? (y/N)"
        read -r response
        if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
            docker-compose down -v --rmi all
            docker system prune -f
            print_success "Cleanup complete!"
        else
            print_status "Cleanup cancelled."
        fi
        ;;
    "")
        main
        ;;
    *)
        echo "Usage: $0 [stop|restart|logs [service]|clean]"
        echo ""
        echo "Commands:"
        echo "  (no args)  Start the development environment"
        echo "  stop       Stop all services"
        echo "  restart    Restart all services"
        echo "  logs       Show logs for all services or specific service"
        echo "  clean      Remove all containers, volumes, and images"
        exit 1
        ;;
esac
