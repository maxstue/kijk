import { ApiError } from '@/shared/types/errors/api-error';

type ApiResponse<TData, TError> =
  | {
      data: TData;
      error?: never;
      response: Response;
    }
  | {
      data?: never;
      error: TError;
      response: Response;
    };

/**
 * Unwraps the data from an API response, throwing an ApiError if the response contains an error or if the data is
 * undefined.
 *
 * @param result The result of an API call, which can either contain data or an error.
 * @returns The data from the API response if the call was successful.
 * @throws ApiError if the API call resulted in an error or if the response data is undefined.
 */
export function unwrapApiData<TData, TError>(result: ApiResponse<TData, TError>) {
  if (result.error) {
    throw new ApiError(result.error, result.response);
  }

  if (result.data === undefined) {
    throw new ApiError({ status: result.response.status, title: 'Empty API response' }, result.response);
  }

  return result.data;
}
