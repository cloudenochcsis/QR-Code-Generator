"""
QR Code Generator Service

Handles QR code generation with various formats and customization options.
Supports PNG, SVG, and PDF output formats with caching capabilities.
"""

import io
import uuid
from datetime import datetime
from typing import Dict, Tuple, Optional
import asyncio
from concurrent.futures import ThreadPoolExecutor

import qrcode
from qrcode.image.styledpil import StyledPilImage
from qrcode.image.styles.moduledrawers import RoundedModuleDrawer, CircleModuleDrawer
from PIL import Image, ImageDraw
import structlog

logger = structlog.get_logger()

class QRCodeGenerator:
    """QR Code generation service with multi-format support"""
    
    def __init__(self):
        self.cache = {}  # In-memory cache for generated QR codes
        self.executor = ThreadPoolExecutor(max_workers=4)
        
        # Error correction levels mapping
        self.error_correction_levels = {
            'L': qrcode.constants.ERROR_CORRECT_L,  # ~7%
            'M': qrcode.constants.ERROR_CORRECT_M,  # ~15%
            'Q': qrcode.constants.ERROR_CORRECT_Q,  # ~25%
            'H': qrcode.constants.ERROR_CORRECT_H,  # ~30%
        }
    
    async def generate_qr_code(
        self,
        data: str,
        format: str = "PNG",
        size: int = 10,
        border: int = 4,
        error_correction: str = "M",
        fill_color: str = "black",
        back_color: str = "white",
        style: Optional[str] = None
    ) -> Dict:
        """
        Generate a QR code with specified parameters
        
        Args:
            data: Data to encode in the QR code
            format: Output format (PNG, SVG, PDF)
            size: QR code size (1-40)
            border: Border size in modules
            error_correction: Error correction level (L, M, Q, H)
            fill_color: Foreground color
            back_color: Background color
            style: Optional style (rounded, circle)
            
        Returns:
            Dictionary containing QR code data and metadata
        """
        qr_id = str(uuid.uuid4())
        
        try:
            logger.info("Generating QR code", 
                       qr_id=qr_id, 
                       data_length=len(data), 
                       format=format)
            
            # Run QR generation in thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            file_data = await loop.run_in_executor(
                self.executor,
                self._generate_qr_sync,
                data, format, size, border, error_correction, 
                fill_color, back_color, style
            )
            
            # Convert file data to base64 for immediate preview
            import base64
            base64_data = base64.b64encode(file_data).decode('utf-8')

            result = {
                "id": qr_id,
                "data": data,
                "format": format,
                "size": size,
                "file_data": file_data,
                "base64_data": base64_data,
                "created_at": datetime.utcnow().isoformat(),
                "file_size": len(file_data)
            }
            
            # Cache the result
            self.cache[qr_id] = result
            
            logger.info("QR code generated successfully", 
                       qr_id=qr_id, 
                       file_size=len(file_data))
            
            return result
            
        except Exception as e:
            logger.error("QR code generation failed", 
                        qr_id=qr_id, 
                        error=str(e))
            raise
    
    def _generate_qr_sync(
        self,
        data: str,
        format: str,
        size: int,
        border: int,
        error_correction: str,
        fill_color: str,
        back_color: str,
        style: Optional[str]
    ) -> bytes:
        """Synchronous QR code generation (runs in thread pool)"""
        
        # Create QR code instance
        qr = qrcode.QRCode(
            version=1,  # Auto-adjust
            error_correction=self.error_correction_levels.get(error_correction, qrcode.constants.ERROR_CORRECT_M),
            box_size=size,
            border=border,
        )
        
        qr.add_data(data)
        qr.make(fit=True)
        
        if format.upper() == "SVG":
            return self._generate_svg(qr, fill_color, back_color)
        elif format.upper() == "PDF":
            return self._generate_pdf(qr, fill_color, back_color)
        else:  # Default to PNG
            return self._generate_png(qr, fill_color, back_color, style)
    
    def _generate_png(self, qr, fill_color: str, back_color: str, style: Optional[str]) -> bytes:
        """Generate PNG format QR code"""
        if style == "rounded":
            img = qr.make_image(
                image_factory=StyledPilImage,
                module_drawer=RoundedModuleDrawer(),
                fill_color=fill_color,
                back_color=back_color
            )
        elif style == "circle":
            img = qr.make_image(
                image_factory=StyledPilImage,
                module_drawer=CircleModuleDrawer(),
                fill_color=fill_color,
                back_color=back_color
            )
        else:
            img = qr.make_image(fill_color=fill_color, back_color=back_color)
        
        # Convert to bytes
        img_buffer = io.BytesIO()
        img.save(img_buffer, format='PNG', optimize=True)
        return img_buffer.getvalue()
    
    def _generate_svg(self, qr, fill_color: str, back_color: str) -> bytes:
        """Generate SVG format QR code"""
        from qrcode.image.svg import SvgPathImage
        
        img = qr.make_image(
            image_factory=SvgPathImage,
            fill_color=fill_color,
            back_color=back_color
        )
        
        # Convert to bytes
        svg_buffer = io.BytesIO()
        img.save(svg_buffer)
        return svg_buffer.getvalue()
    
    def _generate_pdf(self, qr, fill_color: str, back_color: str) -> bytes:
        """Generate PDF format QR code"""
        # First generate PNG, then convert to PDF
        img = qr.make_image(fill_color=fill_color, back_color=back_color)
        
        # Convert PIL image to PDF
        pdf_buffer = io.BytesIO()
        img.save(pdf_buffer, format='PDF', optimize=True)
        return pdf_buffer.getvalue()
    
    async def get_qr_code(self, qr_id: str) -> Tuple[bytes, str]:
        """
        Retrieve a generated QR code from cache
        
        Args:
            qr_id: QR code identifier
            
        Returns:
            Tuple of (file_data, content_type)
        """
        if qr_id not in self.cache:
            raise FileNotFoundError(f"QR code {qr_id} not found")
        
        result = self.cache[qr_id]
        format = result["format"].upper()
        
        content_types = {
            "PNG": "image/png",
            "SVG": "image/svg+xml",
            "PDF": "application/pdf"
        }
        
        return result["file_data"], content_types.get(format, "image/png")
    
    async def generate_wifi_qr(
        self,
        ssid: str,
        password: str,
        security: str = "WPA",
        hidden: bool = False,
        **kwargs
    ) -> Dict:
        """Generate WiFi QR code"""
        wifi_string = f"WIFI:T:{security};S:{ssid};P:{password};H:{'true' if hidden else 'false'};;"
        return await self.generate_qr_code(wifi_string, **kwargs)
    
    async def generate_vcard_qr(
        self,
        name: str,
        phone: str = "",
        email: str = "",
        organization: str = "",
        **kwargs
    ) -> Dict:
        """Generate vCard QR code"""
        vcard = f"""BEGIN:VCARD
VERSION:3.0
FN:{name}
TEL:{phone}
EMAIL:{email}
ORG:{organization}
END:VCARD"""
        return await self.generate_qr_code(vcard, **kwargs)
    
    async def generate_url_qr(self, url: str, **kwargs) -> Dict:
        """Generate URL QR code with validation"""
        if not url.startswith(('http://', 'https://')):
            url = f"https://{url}"
        
        return await self.generate_qr_code(url, **kwargs)
    
    def get_cache_stats(self) -> Dict:
        """Get cache statistics"""
        total_size = sum(len(item["file_data"]) for item in self.cache.values())
        return {
            "cached_items": len(self.cache),
            "total_cache_size": total_size,
            "average_size": total_size / len(self.cache) if self.cache else 0
        }
    
    def clear_cache(self):
        """Clear the QR code cache"""
        self.cache.clear()
        logger.info("QR code cache cleared")
    
    def cleanup(self):
        """Cleanup resources"""
        self.executor.shutdown(wait=True)
        self.clear_cache()
