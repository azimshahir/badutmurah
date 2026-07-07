import en from './en.js';
import ms from './ms.js';
import { WHATSAPP_NUMBER } from '../lib/site.js';

const dicts = { en, ms };

export function getT(locale) {
  return dicts[locale] ?? dicts.en;
}

// Locale-aware wa.me link with translated prefill
export function getWhatsAppLink(locale) {
  const t = getT(locale);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(t.whatsapp.prefill)}`;
}

// Path helpers: EN lives at /, BM at /ms
export function localePath(locale, path) {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return locale === 'ms' ? `/ms${clean === '/' ? '/' : clean}` : clean;
}

export function altLocalePath(locale, pathname) {
  if (locale === 'ms') {
    const stripped = pathname.replace(/^\/ms/, '') || '/';
    return stripped;
  }
  return pathname === '/' ? '/ms/' : `/ms${pathname}`;
}
