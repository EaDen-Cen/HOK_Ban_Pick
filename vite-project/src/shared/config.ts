export const apiURL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
export const portraitAssetURL = (url: string) => url.startsWith('/') && !url.startsWith('//') ? `${apiURL}${url}` : url;
