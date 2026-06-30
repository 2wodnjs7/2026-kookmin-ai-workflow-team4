export const SERVER_URL =
  import.meta.env.VITE_SERVER_URL ?? 'http://127.0.0.1:8080';

export const apiUrl = (path: string) => {
  const base = SERVER_URL.replace(/\/$/, '');
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalized}`;
};
