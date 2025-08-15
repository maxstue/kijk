export const baseUrl =
  process.env.NODE_ENV === 'development'
    ? new URL('http://localhost:5003')
    : new URL(`https://${process.env.VERCEL_URL!}`);
