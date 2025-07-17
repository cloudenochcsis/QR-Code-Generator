import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatsCardProps {
  label: string;
  value: string;
  change: string;
}

export default function StatsCard({ label, value, change }: StatsCardProps) {
  const isPositive = change.startsWith('+');
  const isNegative = change.startsWith('-');
  const isNeutral = !isPositive && !isNegative;

  const getIcon = () => {
    if (isPositive) return TrendingUp;
    if (isNegative) return TrendingDown;
    return Minus;
  };

  const getChangeColor = () => {
    if (isPositive) return 'text-success-600 dark:text-success-400';
    if (isNegative) return 'text-primary-600 dark:text-primary-400';
    return 'text-secondary-600 dark:text-secondary-400';
  };

  const Icon = getIcon();

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-secondary-200 dark:border-secondary-700 p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-secondary-600 dark:text-secondary-400">
            {label}
          </p>
          <p className="text-2xl font-bold text-secondary-900 dark:text-white mt-1">
            {value}
          </p>
        </div>
        <div className={`flex items-center space-x-1 ${getChangeColor()}`}>
          <Icon className="w-4 h-4" />
          <span className="text-sm font-medium">{change}</span>
        </div>
      </div>
    </motion.div>
  );
}
