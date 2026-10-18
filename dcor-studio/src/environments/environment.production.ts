const isDev = typeof window !== 'undefined' && window.location.hostname.includes('dev');

export const environment = {
  production: true,
  apiUrl: isDev 
    ? 'https://dcor-backend-dev.onrender.com/api' 
    : 'https://dcor-furrniture.onrender.com/api'
};
