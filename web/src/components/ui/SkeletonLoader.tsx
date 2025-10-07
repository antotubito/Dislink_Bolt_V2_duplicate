import React from 'react';
import { motion } from 'framer-motion';

interface SkeletonLoaderProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular' | 'profile' | 'form';
  width?: string | number;
  height?: string | number;
  lines?: number;
  animate?: boolean;
}

export function SkeletonLoader({
  className = '',
  variant = 'rectangular',
  width,
  height,
  lines = 1,
  animate = true
}: SkeletonLoaderProps) {
  const baseClasses = 'bg-gray-200 rounded';
  const animationClasses = animate ? 'animate-pulse' : '';

  const getVariantClasses = () => {
    switch (variant) {
      case 'text':
        return 'h-4';
      case 'circular':
        return 'rounded-full';
      case 'profile':
        return 'h-32 w-32 rounded-full';
      case 'form':
        return 'h-12 w-full';
      default:
        return 'h-4 w-full';
    }
  };

  const getStyle = () => {
    const style: React.CSSProperties = {};
    if (width) style.width = typeof width === 'number' ? `${width}px` : width;
    if (height) style.height = typeof height === 'number' ? `${height}px` : height;
    return style;
  };

  if (variant === 'text' && lines > 1) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, index) => (
          <motion.div
            key={index}
            className={`${baseClasses} ${getVariantClasses()} ${animationClasses}`}
            style={getStyle()}
            initial={{ opacity: 0.6 }}
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: index * 0.1
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      className={`${baseClasses} ${getVariantClasses()} ${animationClasses} ${className}`}
      style={getStyle()}
      initial={{ opacity: 0.6 }}
      animate={animate ? { opacity: [0.6, 1, 0.6] } : { opacity: 0.6 }}
      transition={{
        duration: 1.5,
        repeat: animate ? Infinity : 0
      }}
    />
  );
}

// Specialized skeleton components for common use cases
export function ProfileSkeleton() {
  return (
    <div className="flex items-center space-x-4 p-4">
      <SkeletonLoader variant="profile" />
      <div className="space-y-2 flex-1">
        <SkeletonLoader variant="text" width="60%" />
        <SkeletonLoader variant="text" width="40%" />
      </div>
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="space-y-4 p-6">
      <SkeletonLoader variant="form" />
      <SkeletonLoader variant="form" />
      <SkeletonLoader variant="form" />
      <SkeletonLoader variant="rectangular" height="48px" width="100%" />
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="p-6 border rounded-lg">
      <div className="space-y-4">
        <SkeletonLoader variant="text" width="80%" />
        <SkeletonLoader variant="text" lines={3} />
        <div className="flex space-x-2">
          <SkeletonLoader variant="rectangular" height="32px" width="80px" />
          <SkeletonLoader variant="rectangular" height="32px" width="100px" />
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex space-x-4">
          <SkeletonLoader variant="rectangular" height="20px" width="200px" />
          <SkeletonLoader variant="rectangular" height="20px" width="150px" />
          <SkeletonLoader variant="rectangular" height="20px" width="100px" />
        </div>
      ))}
    </div>
  );
}
