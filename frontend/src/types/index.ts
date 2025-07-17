// Type definitions for the QR Code Generator application

export interface QRCodeRequest {
  data: string;
  format?: 'PNG' | 'SVG' | 'PDF';
  size?: number;
  border?: number;
  error_correction?: 'L' | 'M' | 'Q' | 'H';
  fill_color?: string;
  back_color?: string;
}

export interface BatchQRRequest {
  items: string[];
  format?: 'PNG' | 'SVG' | 'PDF';
  size?: number;
}

export interface QRCodeResponse {
  id: string;
  data: string;
  format: string;
  size: number;
  download_url: string;
  aws_url?: string;
  azure_url?: string;
  created_at: string;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  version: string;
  services: Record<string, string>;
}

export interface StatsCardProps {
  label: string;
  value: string;
  change: string;
}

export interface QRPreviewProps {
  qrData: QRCodeResponse | { batch: boolean; items: QRCodeResponse[] } | null;
}

export interface QRGeneratorProps {
  onQRGenerated: (qrData: QRCodeResponse | { batch: boolean; items: QRCodeResponse[] }) => void;
}
