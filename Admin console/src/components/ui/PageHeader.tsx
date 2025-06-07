import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from './Button';

interface PageHeaderProps {
  title: string;
  description?: string;
  backLink?: string;
  actions?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ 
  title, 
  description, 
  backLink,
  actions
}) => {
  const navigate = useNavigate();
  
  return (
    <motion.div 
      className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div>
        {backLink && (
          <button 
            onClick={() => navigate(backLink)}
            className="mb-2 flex items-center text-sm text-gray-600 hover:text-blue-600"
          >
            <ArrowLeft size={16} className="mr-1" />
            Back
          </button>
        )}
        <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
        {description && (
          <p className="text-gray-600 mt-1">{description}</p>
        )}
      </div>
      
      {actions && (
        <div className="flex flex-wrap gap-3 mt-2 sm:mt-0">
          {actions}
        </div>
      )}
    </motion.div>
  );
};

export default PageHeader;