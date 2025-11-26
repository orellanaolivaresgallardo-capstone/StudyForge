import React from 'react';

export interface TopicBadgeProps {
  topic: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'neutral';
}

const TopicBadge: React.FC<TopicBadgeProps> = ({ topic, size = 'md', variant = 'primary' }) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  const variantClasses = {
    primary: 'bg-brand-100 text-brand-700 border-brand-200',
    secondary: 'bg-blue-100 text-blue-700 border-blue-200',
    neutral: 'bg-gray-100 text-gray-700 border-gray-200',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        rounded-full
        border
        font-medium
        transition-all duration-200
      `}
    >
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z"
          clipRule="evenodd"
        />
      </svg>
      {topic}
    </span>
  );
};

export default TopicBadge;
