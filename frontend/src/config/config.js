const config = {
  ENDPOINT_BE_URL: import.meta.env.VITE_ENDPOINT_BE_URL || 'http://localhost:5001',
};

if (import.meta.env.DEV) {
  console.log('Current environment:', import.meta.env.MODE);
  console.log('API endpoint:', config.ENDPOINT_BE_URL);
}

export default config;