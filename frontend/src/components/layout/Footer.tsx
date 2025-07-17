import Link from 'next/link';
import { Github, ExternalLink, Heart } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const links = {
    product: [
      { name: 'API Documentation', href: process.env.NEXT_PUBLIC_API_URL + '/docs', external: true },
      { name: 'Health Status', href: process.env.NEXT_PUBLIC_API_URL + '/health', external: true },
      { name: 'Metrics', href: process.env.NEXT_PUBLIC_API_URL + '/metrics', external: true },
    ],
    resources: [
      { name: 'GitHub Repository', href: 'https://github.com/your-username/multi-cloud-qr-generator', external: true },
      { name: 'Architecture Docs', href: '/docs/architecture', external: false },
      { name: 'Deployment Guide', href: '/docs/deployment', external: false },
    ],
    company: [
      { name: 'About', href: '/about', external: false },
      { name: 'Contact', href: '/contact', external: false },
      { name: 'Privacy Policy', href: '/privacy', external: false },
      { name: 'Terms of Service', href: '/terms', external: false },
    ],
  };

  return (
    <footer className="bg-white dark:bg-secondary-800 border-t border-secondary-200 dark:border-secondary-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <div className="flex items-center justify-center w-8 h-8 bg-primary-500 rounded-lg">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zm8-2v8h8V3h-8zm6 6h-4V5h4v4zM3 21h8v-8H3v8zm2-6h4v4H5v-4z"/>
                </svg>
              </div>
              <span className="text-xl font-bold text-secondary-900 dark:text-white">
                QR Generator
              </span>
            </div>
            <p className="text-secondary-600 dark:text-secondary-300 text-sm mb-4">
              Enterprise-grade QR code generation with multi-cloud reliability and DevOps best practices.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://github.com/your-username/multi-cloud-qr-generator"
                target="_blank"
                rel="noopener noreferrer"
                className="text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300 transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-sm font-semibold text-secondary-900 dark:text-white uppercase tracking-wider mb-4">
              Product
            </h3>
            <ul className="space-y-3">
              {links.product.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    target={link.external ? '_blank' : undefined}
                    rel={link.external ? 'noopener noreferrer' : undefined}
                    className="flex items-center space-x-1 text-secondary-600 hover:text-secondary-900 dark:text-secondary-300 dark:hover:text-white transition-colors text-sm"
                  >
                    <span>{link.name}</span>
                    {link.external && <ExternalLink className="w-3 h-3" />}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h3 className="text-sm font-semibold text-secondary-900 dark:text-white uppercase tracking-wider mb-4">
              Resources
            </h3>
            <ul className="space-y-3">
              {links.resources.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    target={link.external ? '_blank' : undefined}
                    rel={link.external ? 'noopener noreferrer' : undefined}
                    className="flex items-center space-x-1 text-secondary-600 hover:text-secondary-900 dark:text-secondary-300 dark:hover:text-white transition-colors text-sm"
                  >
                    <span>{link.name}</span>
                    {link.external && <ExternalLink className="w-3 h-3" />}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-sm font-semibold text-secondary-900 dark:text-white uppercase tracking-wider mb-4">
              Company
            </h3>
            <ul className="space-y-3">
              {links.company.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    target={link.external ? '_blank' : undefined}
                    rel={link.external ? 'noopener noreferrer' : undefined}
                    className="flex items-center space-x-1 text-secondary-600 hover:text-secondary-900 dark:text-secondary-300 dark:hover:text-white transition-colors text-sm"
                  >
                    <span>{link.name}</span>
                    {link.external && <ExternalLink className="w-3 h-3" />}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-8 pt-8 border-t border-secondary-200 dark:border-secondary-700">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-secondary-600 dark:text-secondary-300 text-sm">
              © {currentYear} Multi-Cloud QR Generator. All rights reserved.
            </p>
            <div className="flex items-center space-x-1 text-secondary-600 dark:text-secondary-300 text-sm mt-4 md:mt-0">
              <span>Built with</span>
              <Heart className="w-4 h-4 text-primary-500" />
              <span>for DevOps excellence</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
