import { motion } from 'framer-motion';
import { Download, ExternalLink } from 'lucide-react';
import { downloadQRCode } from '@/services/api';
import toast from 'react-hot-toast';

interface QRPreviewProps {
  qrData: any;
}

export default function QRPreview({ qrData }: QRPreviewProps) {

  if (!qrData) {
    return (
      <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-secondary-200 dark:border-secondary-700 p-8">
        <div className="text-center text-secondary-500 dark:text-secondary-400">
          <div className="w-32 h-32 mx-auto mb-4 bg-secondary-100 dark:bg-secondary-700 rounded-lg flex items-center justify-center">
            <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zm8-2v8h8V3h-8zm6 6h-4V5h4v4zM3 21h8v-8H3v8zm2-6h4v4H5v-4z"/>
            </svg>
          </div>
          <p className="text-lg font-medium mb-2">No QR Code Generated</p>
          <p className="text-sm">Generate a QR code to see the preview here</p>
        </div>
      </div>
    );
  }

  const handleDownload = async (qrId: string, format: string) => {
    try {
      const blob = await downloadQRCode(qrId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qr-code-${qrId}.${format.toLowerCase()}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('QR code downloaded successfully!');
    } catch (error) {
      toast.error('Failed to download QR code');
    }
  };



  if (qrData.batch) {
    return (
      <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-secondary-200 dark:border-secondary-700 p-6">
        <h3 className="text-lg font-semibold mb-4">Batch QR Codes ({qrData.items.length})</h3>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {qrData.items.map((item: any, index: number) => (
            <div key={item.id} className="flex items-center justify-between p-3 bg-secondary-50 dark:bg-secondary-700 rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-secondary-900 dark:text-white truncate">
                  QR Code {index + 1}
                </p>
              </div>
              <button
                onClick={() => handleDownload(item.id, item.format)}
                className="ml-3 p-2 text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300 transition-colors"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-secondary-200 dark:border-secondary-700 p-6"
    >
      <div className="text-center mb-6">
        <div className="w-48 h-48 mx-auto mb-4 bg-white border-2 border-secondary-200 rounded-lg flex items-center justify-center p-2">
          {qrData.qr_code_base64 ? (
            <img
              src={`data:image/${qrData.format.toLowerCase()};base64,${qrData.qr_code_base64}`}
              alt="Generated QR Code"
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <div className="w-40 h-40 bg-secondary-100 rounded flex items-center justify-center">
              <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zm8-2v8h8V3h-8zm6 6h-4V5h4v4zM3 21h8v-8H3v8zm2-6h4v4H5v-4z"/>
              </svg>
            </div>
          )}
        </div>
        <p className="text-sm text-secondary-600 dark:text-secondary-300 mb-2">
          Format: {qrData.format} • Size: {qrData.size}
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex space-x-3">
          <button
            onClick={() => handleDownload(qrData.id, qrData.format)}
            className="flex-1 btn btn-primary"
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </button>
          
          {qrData.aws_url && (
            <a
              href={qrData.aws_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              AWS
            </a>
          )}
          
          {qrData.azure_url && (
            <a
              href={qrData.azure_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Azure
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}
