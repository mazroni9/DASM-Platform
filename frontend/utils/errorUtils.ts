/**
 * Type-safe error message extraction utility
 * Use this when catching unknown errors to safely access error.message
 */

/**
 * Shape of an axios error response
 */
interface AxiosErrorShape {
  response?: {
    data?: {
      message?: string;
      errors?: Record<string, string[]>;
    };
    status?: number;
  };
  message?: string;
}

/**
 * Type guard to check if error is an axios-like error with response
 */
function isAxiosError(error: unknown): error is AxiosErrorShape {
  return error !== null && typeof error === "object" && "response" in error;
}

/**
 * Extract error message from axios error response
 * @param error - The caught error (unknown type)
 * @param defaultMessage - Default message if error message cannot be extracted
 * @returns The error message string
 */
export function getAxiosErrorMessage(
  error: unknown,
  defaultMessage = "حدث خطأ غير متوقع"
): string {
  if (isAxiosError(error)) {
    return error.response?.data?.message || error.message || defaultMessage;
  }
  return getErrorMessage(error, defaultMessage);
}

/**
 * Get axios error status code
 * @param error - The caught error
 * @returns The status code or undefined
 */
function getAxiosErrorStatus(error: unknown): number | undefined {
  if (isAxiosError(error)) {
    return error.response?.status;
  }
  return undefined;
}

/**
 * Get axios validation errors
 * @param error - The caught error
 * @returns Record of field errors or undefined
 */
function getAxiosValidationErrors(
  error: unknown
): Record<string, string[]> | undefined {
  if (isAxiosError(error) && error.response?.data?.errors) {
    return error.response.data.errors;
  }
  return undefined;
}

/**
 * Extract error message from unknown error type
 * @param error - The caught error (unknown type)
 * @param defaultMessage - Default message if error message cannot be extracted
 * @returns The error message string
 */
export function getErrorMessage(
  error: unknown,
  defaultMessage = "حدث خطأ غير متوقع"
): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }
  return defaultMessage;
}

/**
 * Type guard to check if error is an Error instance
 * @param error - The value to check
 * @returns True if error is an Error instance
 */
function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Type guard to check if error has a message property
 * @param error - The value to check
 * @returns True if error has a message property
 */
function hasMessage(error: unknown): error is { message: string } {
  return (
    error !== null &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  );
}
