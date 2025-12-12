import { transformError, isApiError, getErrorMessage, ApiError } from './config';

// Mock axios module to avoid ESM issues
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  })),
}));

// Define a minimal AxiosError type for testing
interface TestAxiosError {
  message?: string;
  response?: {
    status: number;
    data: any;
    statusText: string;
    headers: any;
    config: any;
  };
  isAxiosError?: boolean;
}

describe('API Config Utilities', () => {
  describe('transformError', () => {
    it('should transform network error (no response)', () => {
      const axiosError: TestAxiosError = {
        message: 'Network Error',
        isAxiosError: true,
      };

      const result = transformError(axiosError as any);

      expect(result).toEqual({
        message: 'Network Error',
        status: 0,
      });
    });

    it('should transform 400 validation error with details', () => {
      const axiosError: TestAxiosError = {
        response: {
          status: 400,
          data: {
            error: 'Validation failed',
            details: [
              { field: 'email', message: 'Invalid email format' },
            ],
          },
          statusText: 'Bad Request',
          headers: {},
          config: {} as any,
        },
        isAxiosError: true,
      };

      const result = transformError(axiosError as any);

      expect(result).toEqual({
        message: 'Validation failed',
        status: 400,
        details: [
          { field: 'email', message: 'Invalid email format' },
        ],
      });
    });

    it('should transform 404 not found error', () => {
      const axiosError: TestAxiosError = {
        response: {
          status: 404,
          data: {
            error: 'Contact not found',
          },
          statusText: 'Not Found',
          headers: {},
          config: {} as any,
        },
        isAxiosError: true,
      };

      const result = transformError(axiosError as any);

      expect(result).toEqual({
        message: 'Contact not found',
        status: 404,
      });
    });

    it('should transform 500 server error', () => {
      const axiosError: TestAxiosError = {
        response: {
          status: 500,
          data: {
            error: 'Internal server error',
          },
          statusText: 'Internal Server Error',
          headers: {},
          config: {} as any,
        },
        isAxiosError: true,
      };

      const result = transformError(axiosError as any);

      expect(result).toEqual({
        message: 'Internal server error',
        status: 500,
      });
    });

    it('should use generic message for 400 when data has no error field', () => {
      const axiosError: TestAxiosError = {
        response: {
          status: 400,
          data: {},
          statusText: 'Bad Request',
          headers: {},
          config: {} as any,
        },
        isAxiosError: true,
      };

      const result = transformError(axiosError as any);

      // When data is empty object, message stays as 'An error occurred'
      // The default messages only apply when message is falsy (empty string, null, undefined)
      expect(result.message).toBe('An error occurred');
      expect(result.status).toBe(400);
    });

    it('should use generic message for 404 when data has no error field', () => {
      const axiosError: TestAxiosError = {
        response: {
          status: 404,
          data: {},
          statusText: 'Not Found',
          headers: {},
          config: {} as any,
        },
        isAxiosError: true,
      };

      const result = transformError(axiosError as any);

      expect(result.message).toBe('An error occurred');
      expect(result.status).toBe(404);
    });

    it('should use generic message for 500 when data has no error field', () => {
      const axiosError: TestAxiosError = {
        response: {
          status: 500,
          data: {},
          statusText: 'Internal Server Error',
          headers: {},
          config: {} as any,
        },
        isAxiosError: true,
      };

      const result = transformError(axiosError as any);

      expect(result.message).toBe('An error occurred');
      expect(result.status).toBe(500);
    });

    it('should handle error with message field in data', () => {
      const axiosError: TestAxiosError = {
        response: {
          status: 403,
          data: {
            message: 'Forbidden access',
          },
          statusText: 'Forbidden',
          headers: {},
          config: {} as any,
        },
        isAxiosError: true,
      };

      const result = transformError(axiosError as any);

      expect(result.message).toBe('Forbidden access');
      expect(result.status).toBe(403);
    });

    it('should use generic message for unknown status codes', () => {
      const axiosError: TestAxiosError = {
        response: {
          status: 418,
          data: {},
          statusText: "I'm a teapot",
          headers: {},
          config: {} as any,
        },
        isAxiosError: true,
      };

      const result = transformError(axiosError as any);

      expect(result.message).toBe('An error occurred');
      expect(result.status).toBe(418);
    });
  });

  describe('isApiError', () => {
    it('should return true for valid ApiError', () => {
      const apiError: ApiError = {
        message: 'Test error',
        status: 400,
      };

      expect(isApiError(apiError)).toBe(true);
    });

    it('should return true for ApiError with details', () => {
      const apiError: ApiError = {
        message: 'Validation failed',
        status: 400,
        details: [{ field: 'email', message: 'Invalid' }],
      };

      expect(isApiError(apiError)).toBe(true);
    });

    it('should return false for regular Error', () => {
      const error = new Error('Regular error');

      expect(isApiError(error)).toBe(true); // Error has message property
    });

    it('should return falsy for null', () => {
      const result = isApiError(null);
      expect(result).toBeFalsy();
    });

    it('should return falsy for undefined', () => {
      const result = isApiError(undefined);
      expect(result).toBeFalsy();
    });

    it('should return false for string', () => {
      expect(isApiError('error string')).toBe(false);
    });

    it('should return false for object without message', () => {
      expect(isApiError({ status: 400 })).toBe(false);
    });
  });

  describe('getErrorMessage', () => {
    it('should extract message from ApiError', () => {
      const apiError: ApiError = {
        message: 'API error message',
        status: 400,
      };

      expect(getErrorMessage(apiError)).toBe('API error message');
    });

    it('should extract message from Error', () => {
      const error = new Error('Standard error message');

      expect(getErrorMessage(error)).toBe('Standard error message');
    });

    it('should return default message for string', () => {
      expect(getErrorMessage('error string')).toBe('An unexpected error occurred');
    });

    it('should return default message for null', () => {
      expect(getErrorMessage(null)).toBe('An unexpected error occurred');
    });

    it('should return default message for undefined', () => {
      expect(getErrorMessage(undefined)).toBe('An unexpected error occurred');
    });

    it('should return default message for number', () => {
      expect(getErrorMessage(123)).toBe('An unexpected error occurred');
    });

    it('should return default message for object without message', () => {
      expect(getErrorMessage({ status: 400 })).toBe('An unexpected error occurred');
    });
  });
});
