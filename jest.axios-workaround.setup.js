const axios = require('axios');

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if ('request' in error) {
      delete error.request;
    }
    if ('response' in error) {
      delete error.response?.request;
    }
    return Promise.reject(error);
  }
);