import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

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
  qr_code_base64: string;  // Base64 encoded QR code image for immediate preview
  aws_url?: string;
  azure_url?: string;
  created_at: string;
}

export const generateQRCode = async (request: QRCodeRequest): Promise<QRCodeResponse> => {
  const response = await api.post('/qr/generate', request);
  return response.data;
};

export const generateBatchQRCodes = async (request: BatchQRRequest): Promise<QRCodeResponse[]> => {
  const response = await api.post('/qr/batch', request);
  return response.data;
};

export const uploadFileForQR = async (file: File): Promise<QRCodeResponse[]> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/qr/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const downloadQRCode = async (qrId: string): Promise<Blob> => {
  const response = await api.get(`/qr/download/${qrId}`, {
    responseType: 'blob',
  });
  return response.data;
};

export const getHealthStatus = async () => {
  const response = await api.get('/health');
  return response.data;
};

export const getMetrics = async () => {
  const response = await api.get('/metrics');
  return response.data;
};

export default api;
