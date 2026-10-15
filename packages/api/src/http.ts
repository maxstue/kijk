import { ApiError } from '@kijk/api/errors';

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
 * Unwraps the data from an API response, requiring data on successful responses. HTTP errors are raised by the API
 * client middleware.
 *
 * @param result The result of an API call, which can either contain data or an error.
 * @returns The data from the API response if the call was successful.
 * @throws ApiError if the response data is undefined.
 */
export function unwrapApiResponse<TData, TError>(result: ApiResponse<TData, TError>) {
  if (result.data === undefined) {
    throw new ApiError({ status: result.response.status, title: 'Empty API response' }, result.response);
  }

  return result.data;
}
