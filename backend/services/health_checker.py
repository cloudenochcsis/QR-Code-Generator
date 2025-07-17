"""
Health Checker Service

Provides comprehensive health checks for the application and its dependencies.
Includes readiness and liveness probes for Kubernetes deployment.
"""

import asyncio
import time
import psutil
from datetime import datetime
from typing import Dict, Any, List
import structlog

logger = structlog.get_logger()

class HealthChecker:
    """Comprehensive health checking service"""
    
    def __init__(self):
        self.start_time = time.time()
        self.last_health_check = None
        self.health_status = "unknown"
        self.dependencies = {}
        
    async def initialize(self):
        """Initialize health checker"""
        logger.info("Initializing health checker")
        self.start_time = time.time()
        self.health_status = "initializing"
        
        # Perform initial health check
        await self.check_health()
        
    async def check_health(self) -> Dict[str, Any]:
        """Comprehensive health check"""
        start_time = time.time()
        
        try:
            # System health checks
            system_health = await self._check_system_health()
            
            # Dependency health checks
            dependency_health = await self._check_dependencies()
            
            # Application health checks
            app_health = await self._check_application_health()
            
            # Determine overall status
            all_services = {**system_health, **dependency_health, **app_health}
            overall_status = "healthy" if all(
                status == "healthy" for status in all_services.values()
            ) else "unhealthy"
            
            health_result = {
                "status": overall_status,
                "timestamp": datetime.utcnow().isoformat(),
                "uptime_seconds": time.time() - self.start_time,
                "check_duration_ms": (time.time() - start_time) * 1000,
                "services": all_services,
                "system_info": await self._get_system_info()
            }
            
            self.last_health_check = health_result
            self.health_status = overall_status
            
            logger.info("Health check completed", 
                       status=overall_status, 
                       duration_ms=health_result["check_duration_ms"])
            
            return health_result
            
        except Exception as e:
            logger.error("Health check failed", error=str(e))
            error_result = {
                "status": "error",
                "timestamp": datetime.utcnow().isoformat(),
                "error": str(e),
                "services": {}
            }
            self.health_status = "error"
            return error_result
    
    async def _check_system_health(self) -> Dict[str, str]:
        """Check system-level health metrics"""
        try:
            # CPU usage check
            cpu_percent = psutil.cpu_percent(interval=0.1)
            cpu_status = "healthy" if cpu_percent < 80 else "unhealthy"
            
            # Memory usage check
            memory = psutil.virtual_memory()
            memory_status = "healthy" if memory.percent < 85 else "unhealthy"
            
            # Disk usage check
            disk = psutil.disk_usage('/')
            disk_status = "healthy" if disk.percent < 90 else "unhealthy"
            
            return {
                "cpu": cpu_status,
                "memory": memory_status,
                "disk": disk_status
            }
            
        except Exception as e:
            logger.error("System health check failed", error=str(e))
            return {
                "cpu": "error",
                "memory": "error", 
                "disk": "error"
            }
    
    async def _check_dependencies(self) -> Dict[str, str]:
        """Check external dependencies"""
        dependencies = {}
        
        # Check storage services (if configured)
        try:
            from .storage_manager import MultiCloudStorageManager
            storage_manager = MultiCloudStorageManager()
            storage_status = await storage_manager.get_storage_status()
            
            dependencies["aws_s3"] = "healthy" if storage_status.get("aws_enabled") else "unavailable"
            dependencies["azure_blob"] = "healthy" if storage_status.get("azure_enabled") else "unavailable"
            
        except Exception as e:
            logger.error("Storage dependency check failed", error=str(e))
            dependencies["aws_s3"] = "error"
            dependencies["azure_blob"] = "error"
        
        # Add more dependency checks as needed
        # dependencies["database"] = await self._check_database()
        # dependencies["redis"] = await self._check_redis()
        
        return dependencies
    
    async def _check_application_health(self) -> Dict[str, str]:
        """Check application-specific health"""
        try:
            # Check QR code generation capability
            from .qr_generator import QRCodeGenerator
            qr_generator = QRCodeGenerator()
            
            # Test QR generation
            test_result = await qr_generator.generate_qr_code("health-check-test")
            qr_status = "healthy" if test_result else "unhealthy"
            
            # Clean up test QR code
            if "id" in test_result:
                qr_generator.cache.pop(test_result["id"], None)
            
            return {
                "qr_generator": qr_status,
                "api": "healthy"  # If we reach here, API is responding
            }
            
        except Exception as e:
            logger.error("Application health check failed", error=str(e))
            return {
                "qr_generator": "error",
                "api": "error"
            }
    
    async def _get_system_info(self) -> Dict[str, Any]:
        """Get system information"""
        try:
            cpu_count = psutil.cpu_count()
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            return {
                "cpu_cores": cpu_count,
                "memory_total_gb": round(memory.total / (1024**3), 2),
                "memory_available_gb": round(memory.available / (1024**3), 2),
                "memory_percent": memory.percent,
                "disk_total_gb": round(disk.total / (1024**3), 2),
                "disk_free_gb": round(disk.free / (1024**3), 2),
                "disk_percent": round((disk.used / disk.total) * 100, 2),
                "python_version": f"{psutil.sys.version_info.major}.{psutil.sys.version_info.minor}.{psutil.sys.version_info.micro}"
            }
            
        except Exception as e:
            logger.error("Failed to get system info", error=str(e))
            return {"error": str(e)}
    
    async def check_readiness(self) -> bool:
        """Kubernetes readiness probe"""
        try:
            # Check if application is ready to serve traffic
            if self.health_status == "initializing":
                return False
            
            # Perform quick health check
            health_result = await self.check_health()
            
            # Consider ready if core services are healthy
            core_services = ["qr_generator", "api"]
            services = health_result.get("services", {})
            
            ready = all(
                services.get(service) == "healthy" 
                for service in core_services
            )
            
            logger.debug("Readiness check", ready=ready, services=services)
            return ready
            
        except Exception as e:
            logger.error("Readiness check failed", error=str(e))
            return False
    
    async def check_liveness(self) -> bool:
        """Kubernetes liveness probe"""
        try:
            # Simple liveness check - just verify the process is responsive
            current_time = time.time()
            uptime = current_time - self.start_time
            
            # Consider alive if process has been running and is responsive
            alive = uptime > 0 and self.health_status != "error"
            
            logger.debug("Liveness check", alive=alive, uptime=uptime)
            return alive
            
        except Exception as e:
            logger.error("Liveness check failed", error=str(e))
            return False
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get health metrics for monitoring"""
        try:
            cpu_percent = psutil.cpu_percent()
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            return {
                "uptime_seconds": time.time() - self.start_time,
                "health_status": self.health_status,
                "cpu_percent": cpu_percent,
                "memory_percent": memory.percent,
                "disk_percent": round((disk.used / disk.total) * 100, 2),
                "last_health_check": self.last_health_check["timestamp"] if self.last_health_check else None
            }
            
        except Exception as e:
            logger.error("Failed to get health metrics", error=str(e))
            return {"error": str(e)}
    
    async def run_periodic_health_checks(self, interval: int = 60):
        """Run periodic health checks in background"""
        logger.info("Starting periodic health checks", interval=interval)
        
        while True:
            try:
                await self.check_health()
                await asyncio.sleep(interval)
            except asyncio.CancelledError:
                logger.info("Periodic health checks cancelled")
                break
            except Exception as e:
                logger.error("Periodic health check failed", error=str(e))
                await asyncio.sleep(interval)
