import { PropsWithChildren, useEffect, useState } from 'react';
import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

interface Props extends PropsWithChildren {
  client: AxiosInstance;
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

// TODO will be removed or refactored with new authprovider
export function ApiInterceptors({ children, client }: Props) {
  const [isSet, setIsSet] = useState(false);
  const { getToken } = useKindeAuth();

  useEffect(() => {
    async function onRequest(request: InternalAxiosRequestConfig) {
      request.headers.set('Authorization', `Bearer ${await getToken()}`);
      request.headers.setContentType('application/json');
      return request;
    }

    const reqinterceptor = client.interceptors.request.use(onRequest, onRequestError);
    const resinterceptor = client.interceptors.response.use(onResponse, onResponseError);

    setIsSet(true);
    return () => {
      client.interceptors.request.eject(reqinterceptor);
      client.interceptors.response.eject(resinterceptor);
    };
  }, [client.interceptors.request, client.interceptors.response, getToken]);

  return isSet && children;
}
