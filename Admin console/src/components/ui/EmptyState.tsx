import React from 'react';
import { motion } from 'framer-motion';
import Button from './Button';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action
}) => {
  return (
    <motion.div 
      className="text-center py-12 px-4 rounded-lg border border-dashed border-gray-300 bg-white"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      {icon && (
        <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-500 mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 max-w-md mx-auto mb-6">{description}</p>
      
      {action && (
        <Button
          variant="primary"
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </motion.div>
  );
};

export default EmptyState;