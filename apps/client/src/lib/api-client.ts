import ky from 'ky';

// TODO add token on each request
const apiClient = ky.create({
  prefixUrl: import.meta.env.VITE_API_URL as string,
});

export { apiClient };
