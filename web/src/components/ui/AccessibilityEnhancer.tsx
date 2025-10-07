import React from 'react';

// Utility function to generate accessible IDs
export function generateAccessibleId(prefix: string, suffix?: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `${prefix}-${suffix || random}-${timestamp}`;
}

// Enhanced form field with accessibility
export interface AccessibleFormFieldProps {
  id: string;
  label: string;
  type?: string;
  required?: boolean;
  error?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function AccessibleFormField({
  id,
  label,
  type = 'text',
  required = false,
  error,
  description,
  children,
  className = ''
}: AccessibleFormFieldProps) {
  const errorId = error ? `${id}-error` : undefined;
  const descriptionId = description ? `${id}-description` : undefined;
  const describedBy = [errorId, descriptionId].filter(Boolean).join(' ');

  return (
    <div className={`space-y-1 ${className}`}>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
        {required && (
          <span className="text-red-500 ml-1" aria-label="required">
            *
          </span>
        )}
      </label>
      
      {description && (
        <p id={descriptionId} className="text-sm text-gray-500">
          {description}
        </p>
      )}
      
      <div className="relative">
        {React.cloneElement(children as React.ReactElement, {
          id,
          'aria-required': required,
          'aria-invalid': error ? 'true' : 'false',
          'aria-describedby': describedBy || undefined,
          'aria-label': label
        })}
      </div>
      
      {error && (
        <p
          id={errorId}
          className="text-sm text-red-600"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}
    </div>
  );
}

// Enhanced button with accessibility
export interface AccessibleButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
  type?: 'button' | 'submit' | 'reset';
}

export function AccessibleButton({
  children,
  onClick,
  disabled = false,
  loading = false,
  variant = 'primary',
  size = 'md',
  className = '',
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  type = 'button'
}: AccessibleButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 disabled:bg-gray-300',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500 disabled:bg-gray-100',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 disabled:bg-gray-300'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={classes}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-busy={loading}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}

// Enhanced input with accessibility
export interface AccessibleInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  description?: string;
  required?: boolean;
}

export function AccessibleInput({
  label,
  error,
  description,
  required = false,
  id,
  className = '',
  ...props
}: AccessibleInputProps) {
  const inputId = id || generateAccessibleId('input', label.toLowerCase().replace(/\s+/g, '-'));
  const errorId = error ? `${inputId}-error` : undefined;
  const descriptionId = description ? `${inputId}-description` : undefined;
  const describedBy = [errorId, descriptionId].filter(Boolean).join(' ');

  return (
    <AccessibleFormField
      id={inputId}
      label={label}
      required={required}
      error={error}
      description={description}
    >
      <input
        {...props}
        id={inputId}
        className={`block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${className}`}
        aria-required={required}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={describedBy || undefined}
        aria-label={label}
      />
    </AccessibleFormField>
  );
}

// Enhanced textarea with accessibility
export interface AccessibleTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  description?: string;
  required?: boolean;
}

export function AccessibleTextarea({
  label,
  error,
  description,
  required = false,
  id,
  className = '',
  ...props
}: AccessibleTextareaProps) {
  const textareaId = id || generateAccessibleId('textarea', label.toLowerCase().replace(/\s+/g, '-'));
  const errorId = error ? `${textareaId}-error` : undefined;
  const descriptionId = description ? `${textareaId}-description` : undefined;
  const describedBy = [errorId, descriptionId].filter(Boolean).join(' ');

  return (
    <AccessibleFormField
      id={textareaId}
      label={label}
      required={required}
      error={error}
      description={description}
    >
      <textarea
        {...props}
        id={textareaId}
        className={`block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${className}`}
        aria-required={required}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={describedBy || undefined}
        aria-label={label}
      />
    </AccessibleFormField>
  );
}

// Enhanced select with accessibility
export interface AccessibleSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  description?: string;
  required?: boolean;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
}

export function AccessibleSelect({
  label,
  error,
  description,
  required = false,
  id,
  className = '',
  options,
  ...props
}: AccessibleSelectProps) {
  const selectId = id || generateAccessibleId('select', label.toLowerCase().replace(/\s+/g, '-'));
  const errorId = error ? `${selectId}-error` : undefined;
  const descriptionId = description ? `${selectId}-description` : undefined;
  const describedBy = [errorId, descriptionId].filter(Boolean).join(' ');

  return (
    <AccessibleFormField
      id={selectId}
      label={label}
      required={required}
      error={error}
      description={description}
    >
      <select
        {...props}
        id={selectId}
        className={`block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${className}`}
        aria-required={required}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={describedBy || undefined}
        aria-label={label}
      >
        <option value="" disabled>
          Select {label.toLowerCase()}
        </option>
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
    </AccessibleFormField>
  );
}

// Screen reader only text
export function ScreenReaderOnly({ children }: { children: React.ReactNode }) {
  return (
    <span className="sr-only">
      {children}
    </span>
  );
}

// Skip link for keyboard navigation
export function SkipLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-md z-50"
    >
      {children}
    </a>
  );
}

// Live region for announcements
export function LiveRegion({ children, level = 'polite' }: { 
  children: React.ReactNode; 
  level?: 'polite' | 'assertive' 
}) {
  return (
    <div
      role="status"
      aria-live={level}
      aria-atomic="true"
      className="sr-only"
    >
      {children}
    </div>
  );
}
