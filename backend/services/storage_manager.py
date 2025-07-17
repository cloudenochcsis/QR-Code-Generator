"""
Multi-Cloud Storage Manager

Handles file storage across AWS S3 and Azure Blob Storage with
unified interface and error handling.
"""

import os
import asyncio
from typing import Optional, Dict, Any
from datetime import datetime, timedelta

import boto3
from botocore.exceptions import ClientError, NoCredentialsError
from azure.storage.blob.aio import BlobServiceClient
from azure.core.exceptions import AzureError
from azure.identity.aio import DefaultAzureCredential
import structlog

logger = structlog.get_logger()

class MultiCloudStorageManager:
    """Unified storage manager for AWS S3 and Azure Blob Storage"""
    
    def __init__(self):
        self.aws_client = None
        self.azure_client = None
        self.aws_bucket = os.getenv("AWS_S3_BUCKET", "qr-codes-bucket")
        self.azure_container = os.getenv("AZURE_CONTAINER", "qr-codes")
        self.aws_region = os.getenv("AWS_REGION", "us-east-1")
        self.azure_account = os.getenv("AZURE_STORAGE_ACCOUNT")
        
        # Storage configuration
        self.aws_enabled = True
        self.azure_enabled = True
        
    async def initialize(self):
        """Initialize cloud storage clients"""
        logger.info("Initializing multi-cloud storage")
        
        # Initialize AWS S3 client
        try:
            self.aws_client = boto3.client(
                's3',
                region_name=self.aws_region,
                aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
                aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY")
            )
            
            # Test AWS connection
            await self._test_aws_connection()
            logger.info("AWS S3 client initialized successfully")
            
        except (NoCredentialsError, ClientError) as e:
            logger.warning("AWS S3 initialization failed", error=str(e))
            self.aws_enabled = False
        
        # Initialize Azure Blob Storage client
        try:
            if self.azure_account:
                credential = DefaultAzureCredential()
                self.azure_client = BlobServiceClient(
                    account_url=f"https://{self.azure_account}.blob.core.windows.net",
                    credential=credential
                )
            else:
                # Use connection string if available
                connection_string = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
                if connection_string:
                    self.azure_client = BlobServiceClient.from_connection_string(connection_string)
            
            if self.azure_client:
                await self._test_azure_connection()
                logger.info("Azure Blob Storage client initialized successfully")
            else:
                raise AzureError("No Azure credentials provided")
                
        except AzureError as e:
            logger.warning("Azure Blob Storage initialization failed", error=str(e))
            self.azure_enabled = False
        
        if not self.aws_enabled and not self.azure_enabled:
            logger.warning("No cloud storage providers available - running in local mode")
            # In development mode, we can continue without cloud storage
            # Files will be stored locally and served directly
    
    async def _test_aws_connection(self):
        """Test AWS S3 connection"""
        try:
            # Try to list buckets or check if bucket exists
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(
                None,
                lambda: self.aws_client.head_bucket(Bucket=self.aws_bucket)
            )
        except ClientError as e:
            if e.response['Error']['Code'] == '404':
                # Bucket doesn't exist, try to create it
                await self._create_aws_bucket()
            else:
                raise
    
    async def _test_azure_connection(self):
        """Test Azure Blob Storage connection"""
        try:
            container_client = self.azure_client.get_container_client(self.azure_container)
            await container_client.get_container_properties()
        except AzureError as e:
            if "ContainerNotFound" in str(e):
                # Container doesn't exist, try to create it
                await self._create_azure_container()
            else:
                raise
    
    async def _create_aws_bucket(self):
        """Create AWS S3 bucket if it doesn't exist"""
        try:
            loop = asyncio.get_event_loop()
            if self.aws_region == 'us-east-1':
                await loop.run_in_executor(
                    None,
                    lambda: self.aws_client.create_bucket(Bucket=self.aws_bucket)
                )
            else:
                await loop.run_in_executor(
                    None,
                    lambda: self.aws_client.create_bucket(
                        Bucket=self.aws_bucket,
                        CreateBucketConfiguration={'LocationConstraint': self.aws_region}
                    )
                )
            logger.info("AWS S3 bucket created", bucket=self.aws_bucket)
        except ClientError as e:
            logger.error("Failed to create AWS S3 bucket", error=str(e))
            raise
    
    async def _create_azure_container(self):
        """Create Azure Blob Storage container if it doesn't exist"""
        try:
            container_client = self.azure_client.get_container_client(self.azure_container)
            await container_client.create_container()
            logger.info("Azure container created", container=self.azure_container)
        except AzureError as e:
            logger.error("Failed to create Azure container", error=str(e))
            raise
    
    async def upload_to_aws(self, file_id: str, file_data: bytes, file_format: str) -> Optional[str]:
        """Upload file to AWS S3"""
        if not self.aws_enabled:
            logger.warning("AWS S3 not available for upload")
            return None
        
        try:
            key = f"qr-codes/{file_id}.{file_format.lower()}"
            content_type = self._get_content_type(file_format)
            
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(
                None,
                lambda: self.aws_client.put_object(
                    Bucket=self.aws_bucket,
                    Key=key,
                    Body=file_data,
                    ContentType=content_type,
                    Metadata={
                        'generated_at': datetime.utcnow().isoformat(),
                        'file_format': file_format
                    }
                )
            )
            
            # Generate presigned URL for download
            url = await loop.run_in_executor(
                None,
                lambda: self.aws_client.generate_presigned_url(
                    'get_object',
                    Params={'Bucket': self.aws_bucket, 'Key': key},
                    ExpiresIn=3600
                )
            )
            
            logger.info("File uploaded to AWS S3", file_id=file_id, key=key)
            return url
            
        except ClientError as e:
            logger.error("AWS S3 upload failed", file_id=file_id, error=str(e))
            return None
    
    async def upload_to_azure(self, file_id: str, file_data: bytes, file_format: str) -> Optional[str]:
        """Upload file to Azure Blob Storage"""
        if not self.azure_enabled:
            logger.warning("Azure Blob Storage not available for upload")
            return None
        
        try:
            blob_name = f"qr-codes/{file_id}.{file_format.lower()}"
            content_type = self._get_content_type(file_format)
            
            blob_client = self.azure_client.get_blob_client(
                container=self.azure_container,
                blob=blob_name
            )
            
            await blob_client.upload_blob(
                file_data,
                content_type=content_type,
                metadata={
                    'generated_at': datetime.utcnow().isoformat(),
                    'file_format': file_format
                },
                overwrite=True
            )
            
            # Generate SAS URL for download
            from azure.storage.blob import generate_blob_sas, BlobSasPermissions
            
            sas_token = generate_blob_sas(
                account_name=self.azure_account,
                container_name=self.azure_container,
                blob_name=blob_name,
                permission=BlobSasPermissions(read=True),
                expiry=datetime.utcnow() + timedelta(hours=1)
            )
            
            url = f"https://{self.azure_account}.blob.core.windows.net/{self.azure_container}/{blob_name}?{sas_token}"
            
            logger.info("File uploaded to Azure Blob Storage", file_id=file_id, blob_name=blob_name)
            return url
            
        except AzureError as e:
            logger.error("Azure Blob Storage upload failed", file_id=file_id, error=str(e))
            return None
    
    async def delete_from_aws(self, file_id: str, file_format: str) -> bool:
        """Delete file from AWS S3"""
        if not self.aws_enabled:
            return False
        
        try:
            key = f"qr-codes/{file_id}.{file_format.lower()}"
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(
                None,
                lambda: self.aws_client.delete_object(
                    Bucket=self.aws_bucket,
                    Key=key
                )
            )
            
            logger.info("File deleted from AWS S3", file_id=file_id, key=key)
            return True
            
        except ClientError as e:
            logger.error("AWS S3 deletion failed", file_id=file_id, error=str(e))
            return False
    
    async def delete_from_azure(self, file_id: str, file_format: str) -> bool:
        """Delete file from Azure Blob Storage"""
        if not self.azure_enabled:
            return False
        
        try:
            blob_name = f"qr-codes/{file_id}.{file_format.lower()}"
            blob_client = self.azure_client.get_blob_client(
                container=self.azure_container,
                blob=blob_name
            )
            
            await blob_client.delete_blob()
            
            logger.info("File deleted from Azure Blob Storage", file_id=file_id, blob_name=blob_name)
            return True
            
        except AzureError as e:
            logger.error("Azure Blob Storage deletion failed", file_id=file_id, error=str(e))
            return False
    
    def _get_content_type(self, file_format: str) -> str:
        """Get content type for file format"""
        content_types = {
            'png': 'image/png',
            'svg': 'image/svg+xml',
            'pdf': 'application/pdf'
        }
        return content_types.get(file_format.lower(), 'application/octet-stream')
    
    async def get_storage_status(self) -> Dict[str, Any]:
        """Get storage provider status"""
        return {
            'aws_enabled': self.aws_enabled,
            'azure_enabled': self.azure_enabled,
            'aws_bucket': self.aws_bucket if self.aws_enabled else None,
            'azure_container': self.azure_container if self.azure_enabled else None
        }
    
    async def cleanup(self):
        """Cleanup resources"""
        if self.azure_client:
            await self.azure_client.close()
        logger.info("Storage manager cleanup completed")
