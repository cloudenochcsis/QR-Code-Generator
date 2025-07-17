import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { QrCode, Menu, X, Github, ExternalLink } from 'lucide-react';
import ThemeToggle from '../ui/ThemeToggle';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'API Docs', href: process.env.NEXT_PUBLIC_API_URL + '/docs', external: true },
    { name: 'Health', href: process.env.NEXT_PUBLIC_API_URL + '/health', external: true },
    { name: 'Metrics', href: process.env.NEXT_PUBLIC_API_URL + '/metrics', external: true },
  ];

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex items-center justify-center w-8 h-8 bg-primary-600 rounded-lg">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              QR Generator
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                target={item.external ? '_blank' : undefined}
                rel={item.external ? 'noopener noreferrer' : undefined}
                className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
              >
                <span>{item.name}</span>
                {item.external && <ExternalLink className="w-3 h-3" />}
              </Link>
            ))}
            
            <a
              href="https://github.com/your-username/multi-cloud-qr-generator"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
            >
              <Github className="w-5 h-5" />
            </a>
            
            <ThemeToggle />
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <ThemeToggle />
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-gray-200 dark:border-gray-700 py-4"
          >
            <div className="flex flex-col space-y-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  target={item.external ? '_blank' : undefined}
                  rel={item.external ? 'noopener noreferrer' : undefined}
                  className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span>{item.name}</span>
                  {item.external && <ExternalLink className="w-3 h-3" />}
                </Link>
              ))}
              
              <a
                href="https://github.com/your-username/multi-cloud-qr-generator"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <Github className="w-5 h-5" />
                <span>GitHub</span>
              </a>
            </div>
          </motion.div>
        )}
      </nav>
    </header>
  );
}
