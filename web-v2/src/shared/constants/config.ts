export const config = {
  apiUrl: import.meta.env.VITE_API_URL as string,
  appName: import.meta.env.VITE_APP_NAME as string,
  platform: import.meta.env.VITE_PLATFORM as string,
  isDev: import.meta.env.DEV as boolean,
  isProd: import.meta.env.PROD as boolean,
} as const
