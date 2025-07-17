"""
Multi-Cloud QR Code Generator Backend API

A FastAPI application that generates QR codes and stores them in multi-cloud storage.
Includes health checks, metrics, and comprehensive error handling.
"""

import io
import logging
import os
import time
from contextlib import asynccontextmanager
from typing import Dict, List, Optional

import structlog
from fastapi import FastAPI, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse, Response
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from prometheus_fastapi_instrumentator import Instrumentator
from pydantic import BaseModel, Field

from services.qr_generator import QRCodeGenerator
from services.storage_manager import MultiCloudStorageManager
from services.health_checker import HealthChecker

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

# Prometheus metrics
qr_generation_counter = Counter('qr_codes_generated_total', 'Total QR codes generated')
qr_generation_duration = Histogram('qr_generation_duration_seconds', 'QR code generation duration')
storage_upload_counter = Counter('storage_uploads_total', 'Total storage uploads', ['provider'])
storage_upload_duration = Histogram('storage_upload_duration_seconds', 'Storage upload duration', ['provider'])

# Pydantic models
class QRCodeRequest(BaseModel):
    """Request model for QR code generation"""
    data: str = Field(..., description="Data to encode in QR code", min_length=1, max_length=4296)
    format: str = Field(default="PNG", description="Output format (PNG, SVG, PDF)")
    size: int = Field(default=10, description="QR code size (1-40)", ge=1, le=40)
    border: int = Field(default=4, description="Border size", ge=0, le=20)
    error_correction: str = Field(default="M", description="Error correction level (L, M, Q, H)")
    fill_color: str = Field(default="black", description="Fill color")
    back_color: str = Field(default="white", description="Background color")

class QRCodeResponse(BaseModel):
    """Response model for QR code generation"""
    id: str
    data: str
    format: str
    size: int
    download_url: str
    qr_code_base64: str  # Base64 encoded QR code image for immediate preview
    aws_url: Optional[str] = None
    azure_url: Optional[str] = None
    created_at: str

class BatchQRRequest(BaseModel):
    """Request model for batch QR code generation"""
    items: List[str] = Field(..., description="List of data items to encode")
    format: str = Field(default="PNG", description="Output format")
    size: int = Field(default=10, description="QR code size", ge=1, le=40)

class HealthResponse(BaseModel):
    """Health check response model"""
    status: str
    timestamp: str
    version: str
    services: Dict[str, str]

# Global instances
qr_generator = QRCodeGenerator()
storage_manager = MultiCloudStorageManager()
health_checker = HealthChecker()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    logger.info("Starting QR Code Generator API")
    
    # Initialize services
    await storage_manager.initialize()
    await health_checker.initialize()
    
    yield
    
    # Cleanup
    logger.info("Shutting down QR Code Generator API")
    await storage_manager.cleanup()

# Create FastAPI application
app = FastAPI(
    title="Multi-Cloud QR Code Generator API",
    description="A production-ready API for generating QR codes with multi-cloud storage",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Prometheus instrumentator
instrumentator = Instrumentator()
instrumentator.instrument(app).expose(app)

@app.get("/", response_model=Dict[str, str])
async def root():
    """Root endpoint"""
    return {
        "message": "Multi-Cloud QR Code Generator API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }

@app.post("/qr/generate", response_model=QRCodeResponse)
async def generate_qr_code(request: QRCodeRequest, background_tasks: BackgroundTasks):
    """Generate a single QR code"""
    start_time = time.time()
    
    try:
        logger.info("Generating QR code", data_length=len(request.data), format=request.format)
        
        # Generate QR code
        with qr_generation_duration.time():
            qr_result = await qr_generator.generate_qr_code(
                data=request.data,
                format=request.format,
                size=request.size,
                border=request.border,
                error_correction=request.error_correction,
                fill_color=request.fill_color,
                back_color=request.back_color
            )
        
        qr_generation_counter.inc()
        
        # Upload to multi-cloud storage in background
        background_tasks.add_task(
            upload_to_storage,
            qr_result["id"],
            qr_result["file_data"],
            request.format.lower()
        )
        
        logger.info("QR code generated successfully", 
                   qr_id=qr_result["id"], 
                   duration=time.time() - start_time)
        
        return QRCodeResponse(
            id=qr_result["id"],
            data=request.data,
            format=request.format,
            size=request.size,
            download_url=f"/qr/download/{qr_result['id']}",
            qr_code_base64=qr_result["base64_data"],
            created_at=qr_result["created_at"]
        )
        
    except Exception as e:
        logger.error("Failed to generate QR code", error=str(e))
        raise HTTPException(status_code=500, detail=f"QR code generation failed: {str(e)}")

@app.post("/qr/batch", response_model=List[QRCodeResponse])
async def generate_batch_qr_codes(request: BatchQRRequest, background_tasks: BackgroundTasks):
    """Generate multiple QR codes in batch"""
    if len(request.items) > 100:
        raise HTTPException(status_code=400, detail="Batch size cannot exceed 100 items")
    
    start_time = time.time()
    results = []
    
    try:
        logger.info("Generating batch QR codes", count=len(request.items))
        
        for item in request.items:
            qr_result = await qr_generator.generate_qr_code(
                data=item,
                format=request.format,
                size=request.size
            )
            
            results.append(QRCodeResponse(
                id=qr_result["id"],
                data=item,
                format=request.format,
                size=request.size,
                download_url=f"/qr/download/{qr_result['id']}",
                created_at=qr_result["created_at"]
            ))
            
            # Upload to storage in background
            background_tasks.add_task(
                upload_to_storage,
                qr_result["id"],
                qr_result["file_data"],
                request.format.lower()
            )
            
            qr_generation_counter.inc()
        
        logger.info("Batch QR codes generated successfully", 
                   count=len(results), 
                   duration=time.time() - start_time)
        
        return results
        
    except Exception as e:
        logger.error("Failed to generate batch QR codes", error=str(e))
        raise HTTPException(status_code=500, detail=f"Batch QR code generation failed: {str(e)}")

@app.get("/qr/download/{qr_id}")
async def download_qr_code(qr_id: str):
    """Download a generated QR code"""
    try:
        file_data, content_type = await qr_generator.get_qr_code(qr_id)
        
        return StreamingResponse(
            io.BytesIO(file_data),
            media_type=content_type,
            headers={"Content-Disposition": f"attachment; filename={qr_id}.png"}
        )
        
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="QR code not found")
    except Exception as e:
        logger.error("Failed to download QR code", qr_id=qr_id, error=str(e))
        raise HTTPException(status_code=500, detail="Download failed")

@app.post("/qr/upload")
async def upload_file_for_qr_generation(file: UploadFile = File(...)):
    """Upload a file and generate QR codes for each line"""
    if not file.filename.endswith(('.txt', '.csv')):
        raise HTTPException(status_code=400, detail="Only .txt and .csv files are supported")
    
    try:
        content = await file.read()
        lines = content.decode('utf-8').strip().split('\n')
        
        if len(lines) > 100:
            raise HTTPException(status_code=400, detail="File cannot contain more than 100 lines")
        
        # Process as batch
        batch_request = BatchQRRequest(items=[line.strip() for line in lines if line.strip()])
        return await generate_batch_qr_codes(batch_request, BackgroundTasks())
        
    except Exception as e:
        logger.error("Failed to process uploaded file", filename=file.filename, error=str(e))
        raise HTTPException(status_code=500, detail="File processing failed")

async def upload_to_storage(qr_id: str, file_data: bytes, file_format: str):
    """Background task to upload QR code to multi-cloud storage"""
    try:
        # Upload to AWS S3
        with storage_upload_duration.labels(provider="aws").time():
            aws_url = await storage_manager.upload_to_aws(qr_id, file_data, file_format)
            storage_upload_counter.labels(provider="aws").inc()
        
        # Upload to Azure Blob Storage
        with storage_upload_duration.labels(provider="azure").time():
            azure_url = await storage_manager.upload_to_azure(qr_id, file_data, file_format)
            storage_upload_counter.labels(provider="azure").inc()
        
        logger.info("QR code uploaded to multi-cloud storage", 
                   qr_id=qr_id, aws_url=aws_url, azure_url=azure_url)
        
    except Exception as e:
        logger.error("Failed to upload to storage", qr_id=qr_id, error=str(e))

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Comprehensive health check endpoint"""
    health_status = await health_checker.check_health()
    
    return HealthResponse(
        status=health_status["status"],
        timestamp=health_status["timestamp"],
        version="1.0.0",
        services=health_status["services"]
    )

@app.get("/health/ready")
async def readiness_check():
    """Kubernetes readiness probe"""
    is_ready = await health_checker.check_readiness()
    
    if is_ready:
        return {"status": "ready"}
    else:
        raise HTTPException(status_code=503, detail="Service not ready")

@app.get("/health/live")
async def liveness_check():
    """Kubernetes liveness probe"""
    return {"status": "alive", "timestamp": time.time()}

@app.get("/metrics")
async def get_metrics():
    """Prometheus metrics endpoint"""
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_config=None  # Use structlog configuration
    )
