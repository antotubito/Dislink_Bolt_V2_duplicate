import { captureError, captureMessage } from './sentry';

/**
 * Sanitizes data to remove PII and secrets before logging
 */
export function sanitizeForLogging(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sensitiveKeys = [
    'password', 'token', 'secret', 'key', 'auth', 'credential',
    'email', 'phone', 'ssn', 'social_security', 'credit_card',
    'api_key', 'private_key', 'access_token', 'refresh_token',
    'session_id', 'cookie', 'authorization', 'bearer'
  ];

  const sanitized = { ...data };

  // Recursively sanitize nested objects
  for (const [key, value] of Object.entries(sanitized)) {
    const lowerKey = key.toLowerCase();
    
    // Check if key contains sensitive information
    if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeForLogging(value);
    }
  }

  return sanitized;
}

/**
 * Creates a safe breadcrumb for Sentry without PII
 */
export function createSafeBreadcrumb(
  message: string,
  category: string,
  data?: any,
  level: 'debug' | 'info' | 'warning' | 'error' = 'info'
) {
  const sanitizedData = sanitizeForLogging(data);
  
  return {
    message,
    category,
    data: sanitizedData,
    level,
    timestamp: new Date().toISOString()
  };
}

/**
 * Logs QR code operations with proper sanitization
 */
export function logQROperation(
  operation: string,
  code: string,
  context: any = {},
  level: 'debug' | 'info' | 'warning' | 'error' = 'info'
) {
  // Sanitize the code (show only first 8 and last 4 characters)
  const sanitizedCode = code ? `${code.substring(0, 8)}...${code.substring(code.length - 4)}` : '[NO_CODE]';
  
  const logData = {
    operation,
    code: sanitizedCode,
    codeLength: code?.length || 0,
    ...sanitizeForLogging(context)
  };

  // Console logging for development
  const logMessage = `[QR-${operation.toUpperCase()}] ${sanitizedCode}`;
  
  switch (level) {
    case 'debug':
      console.debug(logMessage, logData);
      break;
    case 'info':
      console.info(logMessage, logData);
      break;
    case 'warning':
      console.warn(logMessage, logData);
      break;
    case 'error':
      console.error(logMessage, logData);
      break;
  }

  // Sentry breadcrumb for production
  if (import.meta.env.PROD) {
    captureMessage(logMessage, level);
  }
}

/**
 * Logs database queries with sanitized parameters
 */
export function logDatabaseQuery(
  operation: string,
  table: string,
  query: any,
  result?: any,
  error?: any
) {
  const sanitizedQuery = sanitizeForLogging(query);
  const sanitizedResult = result ? sanitizeForLogging(result) : null;
  
  const logData = {
    operation,
    table,
    query: sanitizedQuery,
    result: sanitizedResult ? {
      hasData: !!sanitizedResult.data,
      dataCount: Array.isArray(sanitizedResult.data) ? sanitizedResult.data.length : 
                 sanitizedResult.data ? 1 : 0,
      hasError: !!sanitizedResult.error,
      errorMessage: sanitizedResult.error?.message || null
    } : null,
    error: error ? {
      message: error.message,
      code: error.code,
      details: error.details
    } : null
  };

  const logMessage = `[DB-${operation.toUpperCase()}] ${table}`;
  
  if (error) {
    console.error(logMessage, logData);
    if (import.meta.env.PROD) {
      captureError(error, {
        context: 'database_query',
        operation,
        table,
        query: sanitizedQuery
      });
    }
  } else {
    console.debug(logMessage, logData);
    if (import.meta.env.PROD) {
      captureMessage(logMessage, 'debug');
    }
  }
}

/**
 * Logs user actions with proper PII protection
 */
export function logUserAction(
  action: string,
  userId?: string,
  context: any = {}
) {
  const sanitizedUserId = userId ? `${userId.substring(0, 8)}...${userId.substring(userId.length - 4)}` : '[ANONYMOUS]';
  
  const logData = {
    action,
    userId: sanitizedUserId,
    userIdLength: userId?.length || 0,
    ...sanitizeForLogging(context)
  };

  const logMessage = `[USER-${action.toUpperCase()}] ${sanitizedUserId}`;
  
  console.info(logMessage, logData);
  
  if (import.meta.env.PROD) {
    captureMessage(logMessage, 'info');
  }
}

/**
 * Logs API requests and responses
 */
export function logAPIRequest(
  method: string,
  url: string,
  requestData?: any,
  responseData?: any,
  error?: any
) {
  // Sanitize URL to remove sensitive parameters
  const sanitizedUrl = url.replace(/[?&](token|key|secret|auth|password)=[^&]*/gi, (match, param) => 
    `${param}=[REDACTED]`
  );
  
  const logData = {
    method,
    url: sanitizedUrl,
    requestData: sanitizeForLogging(requestData),
    responseData: responseData ? {
      hasData: !!responseData,
      dataType: typeof responseData,
      dataKeys: typeof responseData === 'object' ? Object.keys(responseData) : null
    } : null,
    error: error ? {
      message: error.message,
      status: error.status,
      code: error.code
    } : null
  };

  const logMessage = `[API-${method.toUpperCase()}] ${sanitizedUrl}`;
  
  if (error) {
    console.error(logMessage, logData);
    if (import.meta.env.PROD) {
      captureError(error, {
        context: 'api_request',
        method,
        url: sanitizedUrl,
        requestData: sanitizeForLogging(requestData)
      });
    }
  } else {
    console.debug(logMessage, logData);
    if (import.meta.env.PROD) {
      captureMessage(logMessage, 'debug');
    }
  }
}

/**
 * Performance logging for QR operations
 */
export function logPerformance(
  operation: string,
  duration: number,
  context: any = {}
) {
  const logData = {
    operation,
    duration,
    durationMs: `${duration}ms`,
    ...sanitizeForLogging(context)
  };

  const logMessage = `[PERF-${operation.toUpperCase()}] ${duration}ms`;
  
  if (duration > 5000) { // Log slow operations as warnings
    console.warn(logMessage, logData);
    if (import.meta.env.PROD) {
      captureMessage(logMessage, 'warning');
    }
  } else {
    console.debug(logMessage, logData);
    if (import.meta.env.PROD) {
      captureMessage(logMessage, 'debug');
    }
  }
}
