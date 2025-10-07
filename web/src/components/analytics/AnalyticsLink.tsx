/**
 * Analytics Link Component
 * A link that automatically tracks clicks and navigation
 */

import React from 'react';
import { Link, LinkProps } from 'react-router-dom';
import { useInteractionTracking } from '../../hooks/useAnalytics';

interface AnalyticsLinkProps extends Omit<LinkProps, 'to'> {
  to: string;
  children: React.ReactNode;
  analyticsName: string;
  analyticsProperties?: Record<string, any>;
  variant?: 'default' | 'button' | 'text';
  external?: boolean;
}

export const AnalyticsLink: React.FC<AnalyticsLinkProps> = ({
  to,
  children,
  analyticsName,
  analyticsProperties = {},
  variant = 'default',
  external = false,
  onClick,
  className = '',
  ...props
}) => {
  const { trackLinkClick } = useInteractionTracking();

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    // Track the link click
    trackLinkClick(to, analyticsName, {
      variant,
      external,
      ...analyticsProperties
    });

    // Call the original onClick handler
    if (onClick) {
      onClick(event);
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'button':
        return 'inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors';
      case 'text':
        return 'text-blue-600 hover:text-blue-800 underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded';
      default:
        return 'text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded transition-colors';
    }
  };

  const baseClasses = getVariantClasses();
  const combinedClassName = `${baseClasses} ${className}`.trim();

  if (external) {
    return (
      <a
        href={to}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className={combinedClassName}
        {...props}
      >
        {children}
        <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    );
  }

  return (
    <Link
      to={to}
      onClick={handleClick}
      className={combinedClassName}
      {...props}
    >
      {children}
    </Link>
  );
};
