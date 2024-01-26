import axios, { AxiosError, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

import { env } from '@/shared/env';
import { supabase } from '@/shared/lib/supabase-client';
import { ApiError } from '@/shared/types/app';

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

async function onRequest(request: InternalAxiosRequestConfig) {
  request.headers.set('Authorization', `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`);
  request.headers.setContentType('application/json');
  return request;
}

// Do something with respone data. Any 2** statusCode will trigger this function
function onResponse(response: AxiosResponse) {
  return response;
}

// Do something with respone error. Any statusCode outside 2** will trigger this function
async function onResponseError(error: AxiosError) {
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
