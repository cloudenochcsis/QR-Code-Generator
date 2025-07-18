import { useState } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import Layout from '@/components/layout/Layout';
import QRGenerator from '@/components/forms/QRGenerator';
import QRPreview from '@/components/ui/QRPreview';
import StatsCard from '@/components/ui/StatsCard';
import { QrCode, Cloud, Shield, Zap } from 'lucide-react';

export default function Home() {
  const [generatedQR, setGeneratedQR] = useState<any>(null);

  const features = [
    {
      icon: QrCode,
      title: 'Multiple Formats',
      description: 'Generate QR codes in PNG, SVG, and PDF formats',
      color: 'text-primary-500',
    },
    {
      icon: Cloud,
      title: 'Multi-Cloud Storage',
      description: 'Automatic backup to AWS S3 and Azure Blob Storage',
      color: 'text-success-500',
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'Production-ready with comprehensive security measures',
      color: 'text-secondary-600',
    },
    {
      icon: Zap,
      title: 'High Performance',
      description: 'Fast generation with Kubernetes auto-scaling',
      color: 'text-warning-500',
    },
  ];

  const stats = [
    { label: 'QR Codes Generated', value: '10,000+', change: '+12%' },
    { label: 'Uptime', value: '99.9%', change: '+0.1%' },
    { label: 'Response Time', value: '<100ms', change: '-5ms' },
    { label: 'Cloud Regions', value: '2', change: 'Stable' },
  ];

  return (
    <>
      <Head>
        <title>Multi-Cloud QR Code Generator</title>
        <meta name="description" content="Generate QR codes with enterprise-grade reliability across AWS and Azure" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Layout>
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-secondary-900 dark:via-secondary-800 dark:to-secondary-900">
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
            <div className="text-center">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-4xl md:text-6xl font-bold text-secondary-900 dark:text-white mb-6"
              >
                Multi-Cloud{' '}
                <span className="bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent">
                  QR Generator
                </span>
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-xl text-secondary-600 dark:text-secondary-300 mb-8 max-w-3xl mx-auto"
              >
                Enterprise-grade QR code generation with automatic multi-cloud backup,
                Kubernetes orchestration, and production-ready DevOps practices.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="flex flex-wrap justify-center gap-4 mb-12"
              >
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                  AWS S3
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                  Azure Blob
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-200">
                  Kubernetes
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-secondary-100 text-secondary-800 dark:bg-secondary-900 dark:text-secondary-200">
                  Docker
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-200">
                  Terraform
                </span>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 bg-white dark:bg-secondary-800 border-b border-secondary-200 dark:border-secondary-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <StatsCard {...stat} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* QR Generator Form */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="space-y-8"
              >
                <div>
                  <h2 className="text-3xl font-bold text-secondary-900 dark:text-white mb-4">
                    Generate QR Code
                  </h2>
                  <p className="text-secondary-600 dark:text-secondary-300">
                    Create high-quality QR codes with customizable options and automatic cloud backup.
                  </p>
                </div>
                
                <QRGenerator onQRGenerated={setGeneratedQR} />
              </motion.div>

              {/* QR Preview */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="space-y-8"
              >
                <div>
                  <h2 className="text-3xl font-bold text-secondary-900 dark:text-white mb-4">
                    Preview & Download
                  </h2>
                  <p className="text-secondary-600 dark:text-secondary-300">
                    Preview your generated QR code and download in multiple formats.
                  </p>
                </div>
                
                <QRPreview qrData={generatedQR} />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-secondary-50 dark:bg-secondary-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-secondary-900 dark:text-white mb-4">
                Enterprise Features
              </h2>
              <p className="text-xl text-secondary-600 dark:text-secondary-300 max-w-3xl mx-auto">
                Built with production-ready DevOps practices and enterprise-grade reliability.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-white dark:bg-secondary-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg bg-secondary-100 dark:bg-secondary-700 mb-4`}>
                    <feature.icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-secondary-600 dark:text-secondary-300">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </Layout>
    </>
  );
}
