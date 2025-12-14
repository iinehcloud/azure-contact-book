import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL; // || 'http://localhost:3000';

// Create Axios instance with base configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for common headers
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add any common headers here (e.g., authentication tokens in the future)
    // For now, just log the request in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log successful responses in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`API Response: ${response.status} ${response.config.url}`);
    }
    return response;
  },
  (error: AxiosError) => {
    // Transform error before rejecting
    const transformedError = transformError(error);
    return Promise.reject(transformedError);
  }
);

// Error transformation utilities
export interface ApiError {
  message: string;
  status?: number;
  details?: any;
  field?: string;
}

/**
 * Transform Axios error into a standardized ApiError format
 */
export function transformError(error: AxiosError): ApiError {
  // Network error (no response from server)
  if (!error.response) {
    return {
      message: error.message || 'Network error. Please check your connection.',
      status: 0,
    };
  }

  const { status, data } = error.response;

  // Server returned an error response
  const apiError: ApiError = {
    message: 'An error occurred',
    status,
  };

  // Extract error message from response data
  if (data && typeof data === 'object') {
    const errorData = data as any;
    
    // Handle validation errors with details
    if (errorData.error) {
      apiError.message = errorData.error;
    }
    
    if (errorData.details) {
      apiError.details = errorData.details;
    }

    if (errorData.message) {
      apiError.message = errorData.message;
    }
  }

  // Provide user-friendly messages for common status codes
  switch (status) {
    case 400:
      apiError.message = apiError.message || 'Invalid request. Please check your input.';
      break;
    case 404:
      apiError.message = apiError.message || 'Resource not found.';
      break;
    case 500:
      apiError.message = apiError.message || 'Server error. Please try again later.';
      break;
    default:
      apiError.message = apiError.message || `Request failed with status ${status}`;
  }

  return apiError;
}

/**
 * Check if an error is an ApiError
 */
export function isApiError(error: any): error is ApiError {
  return error && typeof error === 'object' && 'message' in error;
}

/**
 * Get error message from any error type
 */
export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
}

export default apiClient;
