import React from 'react';
import { Link } from 'react-router-dom';

export interface SpaceBadgeProps {
  spaceName: string;
  spaceId: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  clickable?: boolean;
}

const SpaceBadge: React.FC<SpaceBadgeProps> = ({
  spaceName,
  spaceId,
  color = '#8B5CF6',
  size = 'md',
  clickable = true,
}) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  const badgeContent = (
    <span
      className={`
        inline-flex items-center gap-1.5
        ${sizeClasses[size]}
        rounded-full
        font-medium
        text-white
        transition-all duration-200
        ${clickable ? 'hover:scale-105 hover:shadow-md cursor-pointer' : ''}
      `}
      style={{ backgroundColor: color }}
    >
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 6a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6z"
          clipRule="evenodd"
        />
      </svg>
      {spaceName}
    </span>
  );

  if (clickable) {
    return (
      <Link to={`/spaces/${spaceId}`} className="inline-block">
        {badgeContent}
      </Link>
    );
  }

  return badgeContent;
};

export default SpaceBadge;
