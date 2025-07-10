export const getSessionValue = (key: string, defaultValue: string) => {
  const value = sessionStorage.getItem(key);
  return value !== null ? value : defaultValue;
};