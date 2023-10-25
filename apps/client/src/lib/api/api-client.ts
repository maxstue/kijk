import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';

import { env } from '@/env';
import { ApiError } from '@/types/app';

/** Overrides axios requestoptions, so that the url prop is mandatory */
interface RequestOptions<T = unknown> extends Omit<AxiosRequestConfig<T>, 'url'> {
  url: string;
  abort?: AbortController;
  data?: T;
}
const onFulfilled = <TReturn>(res: AxiosResponse<TReturn, unknown>) => res.data;

const onRejected = (error: AxiosError<ApiError>) => {
  console.error(error);
  return Promise.reject(error);
};

const baseInstance = axios.create({
  baseURL: env.ApiUrl,
});

/** The base api instance. */
const apiClient = {
  async get<TReturn = unknown>(options: RequestOptions) {
    const { url, abort } = options;
    return baseInstance
      .get<TReturn>(url, { ...options, signal: abort?.signal })
      .then(onFulfilled)
      .catch(onRejected);
  },

  async post<TReturn = unknown>(options: RequestOptions) {
    const { url, abort, data } = options;
    return baseInstance
      .post<TReturn>(url, data, { ...options, signal: abort?.signal })
      .then(onFulfilled)
      .catch(onRejected);
  },

  async put<TReturn = unknown>(options: RequestOptions) {
    const { url, abort, data } = options;
    return baseInstance
      .put<TReturn>(url, data, { ...options, signal: abort?.signal })
      .then(onFulfilled)
      .catch(onRejected);
  },

  async delete<TReturn = unknown>(options: RequestOptions) {
    const { url, abort, data } = options;
    return baseInstance
      .delete<TReturn>(url, { ...options, data, signal: abort?.signal })
      .then(onFulfilled)
      .catch(onRejected);
  },
};

export { apiClient, baseInstance };
