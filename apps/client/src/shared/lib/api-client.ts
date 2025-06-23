import axios from 'axios';
import type { AxiosError, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

import type { ApiError } from '@/shared/types/app';
import { env } from '@/shared/env';
import { getAuthToken } from '@/shared/lib/auth-client';

/** Overrides axios requestoptions, so that the url prop is mandatory */
interface RequestOptions<T = unknown> extends Omit<AxiosRequestConfig<T>, 'url'> {
  url: string;
  abort?: AbortController;
  data?: T;
}
const onFulfilled = <TReturn>(response: AxiosResponse<TReturn, unknown>) => response.data;

const onRejected = (error: unknown) => {
  console.error(error);
  return Promise.reject(error as AxiosError<ApiError>);
};

const baseInstance = axios.create({
  baseURL: env.ApiUrl,
});

async function onRequest(request: InternalAxiosRequestConfig) {
  request.headers.set('Authorization', `Bearer ${(await getAuthToken()) ?? ''}`);
  request.headers.setContentType('application/json');
  return request;
}

// Do something with response data. Any 2** statusCode will trigger this function
function onResponse(response: AxiosResponse) {
  return response;
}

// Do something with response error. Any statusCode outside 2** will trigger this function
function onResponseError(error: AxiosError) {
  return Promise.reject(error);
}

function onRequestError(error: AxiosError) {
  return Promise.reject(error);
  // TODO handle 401
  // const errInterceptor = (error) => {
  //   if (error.response.status === 401) {
  //     //redirect logic here
  //   }

  //   return Promise.reject();
  // };
}

baseInstance.interceptors.request.use(onRequest, onRequestError);
baseInstance.interceptors.response.use(onResponse, onResponseError);

/** The base api instance. */
const apiClient = {
  get<TReturn = unknown>(options: RequestOptions) {
    const { url, abort } = options;
    return baseInstance
      .get<TReturn>(url, { ...options, signal: abort?.signal })
      .then(onFulfilled)
      .catch(onRejected);
  },

  post<TReturn = unknown>(options: RequestOptions) {
    const { url, abort, data } = options;
    return baseInstance
      .post<TReturn>(url, data, { ...options, signal: abort?.signal })
      .then(onFulfilled)
      .catch(onRejected);
  },

  put<TReturn = unknown>(options: RequestOptions) {
    const { url, abort, data } = options;
    return baseInstance
      .put<TReturn>(url, data, { ...options, signal: abort?.signal })
      .then(onFulfilled)
      .catch(onRejected);
  },

  delete<TReturn = unknown>(options: RequestOptions) {
    const { url, abort, data } = options;
    return baseInstance
      .delete<TReturn>(url, { ...options, data, signal: abort?.signal })
      .then(onFulfilled)
      .catch(onRejected);
  },
};

export { apiClient, baseInstance };
