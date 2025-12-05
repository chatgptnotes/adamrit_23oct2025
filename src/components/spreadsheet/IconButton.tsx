import React from 'react';

interface IconButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  title?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  children,
  onClick,
  className = '',
  disabled = false,
  title
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1 hover:bg-gray-100 rounded transition-colors duration-150 ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      } ${className}`}
    >
      {children}
    </button>
  );
};
