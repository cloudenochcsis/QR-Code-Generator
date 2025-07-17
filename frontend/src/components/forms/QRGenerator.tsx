import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from 'react-query';
import { motion } from 'framer-motion';
import { Upload, Loader2, QrCode, FileText } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { generateQRCode, generateBatchQRCodes, uploadFileForQR } from '@/services/api';

interface QRGeneratorProps {
  onQRGenerated: (qrData: any) => void;
}

interface QRFormData {
  data: string;
  format: 'PNG' | 'SVG' | 'PDF';
  size: number;
  border: number;
  error_correction: 'L' | 'M' | 'Q' | 'H';
  fill_color: string;
  back_color: string;
}

export default function QRGenerator({ onQRGenerated }: QRGeneratorProps) {
  const [activeTab, setActiveTab] = useState<'single' | 'batch' | 'file'>('single');
  const [batchItems, setBatchItems] = useState<string[]>(['']);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<QRFormData>({
    defaultValues: {
      data: '',
      format: 'PNG',
      size: 10,
      border: 4,
      error_correction: 'M',
      fill_color: '#000000',
      back_color: '#ffffff',
    },
  });

  const generateMutation = useMutation(generateQRCode, {
    onSuccess: (data) => {
      toast.success('QR code generated successfully!');
      onQRGenerated(data);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to generate QR code');
    },
  });

  const batchMutation = useMutation(generateBatchQRCodes, {
    onSuccess: (data) => {
      toast.success(`Generated ${data.length} QR codes successfully!`);
      onQRGenerated({ batch: true, items: data });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to generate batch QR codes');
    },
  });

  const fileMutation = useMutation(uploadFileForQR, {
    onSuccess: (data) => {
      toast.success(`Generated ${data.length} QR codes from file!`);
      onQRGenerated({ batch: true, items: data });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to process file');
    },
  });

  const onSubmit = (data: QRFormData) => {
    generateMutation.mutate(data);
  };

  const handleBatchGenerate = () => {
    const validItems = batchItems.filter(item => item.trim());
    if (validItems.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    const formData = watch();
    batchMutation.mutate({
      items: validItems,
      format: formData.format,
      size: formData.size,
    });
  };

  const addBatchItem = () => {
    setBatchItems([...batchItems, '']);
  };

  const removeBatchItem = (index: number) => {
    setBatchItems(batchItems.filter((_, i) => i !== index));
  };

  const updateBatchItem = (index: number, value: string) => {
    const newItems = [...batchItems];
    newItems[index] = value;
    setBatchItems(newItems);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'text/plain': ['.txt'],
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        fileMutation.mutate(acceptedFiles[0]);
      }
    },
  });

  const tabs = [
    { id: 'single', label: 'Single QR', icon: QrCode },
    { id: 'batch', label: 'Batch QR', icon: FileText },
    { id: 'file', label: 'File Upload', icon: Upload },
  ];



  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Single QR Generation */}
      {activeTab === 'single' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">


            {/* Data Input */}
            <div>
              <label htmlFor="data" className="form-label">
                Content *
              </label>
              <textarea
                {...register('data', { required: 'Content is required' })}
                className="form-textarea"
                rows={3}
                placeholder="Enter the content for your QR code..."
              />
              {errors.data && (
                <p className="mt-1 text-sm text-red-600">{errors.data.message}</p>
              )}
            </div>

            {/* Format and Size */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="format" className="form-label">
                  Format
                </label>
                <select {...register('format')} className="form-input">
                  <option value="PNG">PNG</option>
                  <option value="SVG">SVG</option>
                  <option value="PDF">PDF</option>
                </select>
              </div>

              <div>
                <label htmlFor="size" className="form-label">
                  Size: {watch('size')}
                </label>
                <input
                  {...register('size', { min: 1, max: 40 })}
                  type="range"
                  min="1"
                  max="40"
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
              </div>
            </div>

            {/* Advanced Options */}
            <details className="group">
              <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                Advanced Options
              </summary>
              <div className="mt-4 space-y-4 pl-4 border-l-2 border-gray-200 dark:border-gray-600">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="border" className="form-label">
                      Border: {watch('border')}
                    </label>
                    <input
                      {...register('border', { min: 0, max: 20 })}
                      type="range"
                      min="0"
                      max="20"
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    />
                  </div>

                  <div>
                    <label htmlFor="error_correction" className="form-label">
                      Error Correction
                    </label>
                    <select {...register('error_correction')} className="form-input">
                      <option value="L">Low (~7%)</option>
                      <option value="M">Medium (~15%)</option>
                      <option value="Q">Quartile (~25%)</option>
                      <option value="H">High (~30%)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="fill_color" className="form-label">
                      Foreground Color
                    </label>
                    <input
                      {...register('fill_color')}
                      type="color"
                      className="form-input h-10"
                    />
                  </div>

                  <div>
                    <label htmlFor="back_color" className="form-label">
                      Background Color
                    </label>
                    <input
                      {...register('back_color')}
                      type="color"
                      className="form-input h-10"
                    />
                  </div>
                </div>
              </div>
            </details>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={generateMutation.isLoading}
              className="w-full btn btn-primary btn-lg"
            >
              {generateMutation.isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <QrCode className="w-5 h-5 mr-2" />
                  Generate QR Code
                </>
              )}
            </button>
          </form>
        </motion.div>
      )}

      {/* Batch QR Generation */}
      {activeTab === 'batch' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          <div>
            <label className="form-label mb-3 block">Batch Items</label>
            <div className="space-y-3">
              {batchItems.map((item, index) => (
                <div key={index} className="flex space-x-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => updateBatchItem(index, e.target.value)}
                    placeholder={`Item ${index + 1}`}
                    className="form-input flex-1"
                  />
                  {batchItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeBatchItem(index)}
                      className="px-3 py-2 text-red-600 hover:text-red-800 transition-colors"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addBatchItem}
              className="mt-3 text-sm text-primary-600 hover:text-primary-800 transition-colors"
            >
              + Add Item
            </button>
          </div>

          <button
            onClick={handleBatchGenerate}
            disabled={batchMutation.isLoading}
            className="w-full btn btn-primary btn-lg"
          >
            {batchMutation.isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Generating Batch...
              </>
            ) : (
              <>
                <FileText className="w-5 h-5 mr-2" />
                Generate Batch QR Codes
              </>
            )}
          </button>
        </motion.div>
      )}

      {/* File Upload */}
      {activeTab === 'file' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
              isDragActive
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-primary-400'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {isDragActive ? 'Drop the file here' : 'Upload a file'}
            </p>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Drag and drop a .txt or .csv file, or click to browse
            </p>
            <p className="text-sm text-gray-500">
              Each line in the file will generate a separate QR code (max 100 lines)
            </p>
          </div>

          {fileMutation.isLoading && (
            <div className="mt-4 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              <span>Processing file...</span>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
