export type FieldErrors = Record<string, string>;

export function scrollToFirstError(errors: FieldErrors): void {
  const firstKey = Object.keys(errors)[0];
  if (!firstKey) return;
  const el = document.querySelector(`[data-field="${firstKey}"]`) as HTMLElement | null;
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const input = el.querySelector('input, textarea, select') as HTMLElement | null;
    input?.focus();
  }
}

export const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export const isValidUrl = (v: string) => {
  try {
    new URL(v);
    return true;
  } catch {
    return false;
  }
};
