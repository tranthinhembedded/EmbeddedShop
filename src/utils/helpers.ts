export const noop = () => undefined;

export const delay = (ms: number) =>
  new Promise<void>(resolve => {
    setTimeout(() => resolve(), ms);
  });

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const compactPhoneNumber = (value: string) =>
  value.trim().replace(/[\s().-]/g, '');

export const isValidVietnamPhoneNumber = (value: string) => {
  const compact = compactPhoneNumber(value);

  if (!compact) {
    return false;
  }

  return (
    /^\+84\d{9,10}$/.test(compact) ||
    /^84\d{9,10}$/.test(compact) ||
    /^0\d{9,10}$/.test(compact)
  );
};
