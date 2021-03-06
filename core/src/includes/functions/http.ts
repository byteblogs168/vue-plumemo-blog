import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { getApiPath } from './settings';
import { hook } from './hooks';

// Types
import { Response } from 'types/datas/response';

/**
 * @author Hubert
 * @since 2020-09-04
 * @version 0.0.1
 * http factory（内部接口使用）
 * baseURL 从配置中得到
 * timeout 10s
 */
const instance = axios.create({
  baseURL: getApiPath(),
  timeout: 10000,
});

// request interceptor
instance.interceptors.request.use((config: AxiosRequestConfig) => {
  return hook('pre_request').filter(config);
}, undefined);

// response interceptor
instance.interceptors.response.use(
  (resp: AxiosResponse<Response<any>>) => {
    return hook('pre_response')
      .filter(resp)
      .then((resp) => {
        if (!resp.data.success) return Promise.reject(new Error(resp.data.message));
        return resp;
      });
  },
  (err: AxiosError) => {
    if (err.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      // if (err.response.status === 401) {
      // }
      // else if (err.response.status === 403) {
      //   err.message = '您没有执行该操作的权限'
      // }
    } else if (err.request) {
      // The request was made but no response was received
      // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
      // http.ClientRequest in node.js
      if (err.message === 'Network Error') {
        const config = err.config;
        if (config && config.retry) {
          // Set the variable for keeping track of the retry count
          config.__retryCount = config.__retryCount || 0;

          // Check if we've maxed out the total number of retries
          if (config.__retryCount < config.retry) {
            // Increase the retry count
            config.__retryCount += 1;

            // Create new promise to handle exponential backoff.
            // formula(2 ^ c - 1 / 2) * 1000(for mS to seconds)
            const backoff = new Promise((resolve) => {
              const backOffDelay = config.retryDelay ? (1 / 2) * (Math.pow(2, config.__retryCount!) - 1) * 1000 : 1;
              setTimeout(() => {
                resolve();
              }, backOffDelay);
            });

            // Return the promise in which recalls axios to retry the request
            return backoff.then(() => {
              return instance(config);
            });
          }
        }
      }
    }
    // Compatible server-side custom error
    if (!err.isAxiosError) {
      const error = (err.response && err.response.data) || {};
      err.code = error.resultCode || 500;
      err.message = error.message || 'System error!';
    }
    return Promise.reject(err);
  },
);

export const http = instance;
