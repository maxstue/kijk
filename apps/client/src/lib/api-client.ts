import ky from 'ky';

const apiClient = ky.create({
  prefixUrl: import.meta.env.VITE_API_URL as string,
});

export { apiClient };
