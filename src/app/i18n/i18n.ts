import { inject, Injectable, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { TranslocoService } from '@jsverse/transloco';

export type Lang = 'EN' | 'RU' | 'CS';

/** Languages offered in the UI, in display order. */
export const LANGUAGES: readonly Lang[] = ['EN', 'RU', 'CS'];

export const DEFAULT_LANG: Lang = 'EN';

/** Human-readable name for each language, in its own script. */
export const LANG_NAMES: Record<Lang, string> = {
  EN: 'English',
  RU: 'Русский',
  CS: 'Čeština',
};

const STORAGE_KEY = 'neboltai.lang';

/** Map the UI code (uppercase) to the Transloco scope id (lowercase). */
function toScope(lang: Lang): string {
  return lang.toLowerCase();
}

function fromScope(scope: string): Lang {
  const upper = scope.toUpperCase();
  return (LANGUAGES as readonly string[]).includes(upper) ? (upper as Lang) : DEFAULT_LANG;
}

/**
 * Thin, signal-based facade over {@link TranslocoService}.
 *
 * Components read {@link lang} for the active language and call {@link setLang}
 * to switch it live. The choice is persisted to `localStorage` and restored on
 * the next load. SSR-safe: `localStorage` is only touched in a browser.
 */
@Injectable({ providedIn: 'root' })
export class I18n {
  private readonly transloco = inject(TranslocoService);
  private readonly document = inject(DOCUMENT);

  readonly lang = signal<Lang>(DEFAULT_LANG);
  readonly languages = LANGUAGES;
  readonly languageNames = LANG_NAMES;

  constructor() {
    const initial = this.readStored() ?? fromScope(this.transloco.getActiveLang());
    this.applyLang(initial);

    // Keep the signal in sync if the active language changes elsewhere.
    this.transloco.langChanges$.subscribe((scope) => this.lang.set(fromScope(scope)));
  }

  /** Switch the active language and persist the choice. */
  setLang(lang: Lang): void {
    this.applyLang(lang);
  }

  /** Imperative translate for use in component code (templates use the pipe). */
  translate(key: string, params?: Record<string, unknown>): string {
    return this.transloco.translate(key, params);
  }

  private applyLang(lang: Lang): void {
    this.transloco.setActiveLang(toScope(lang));
    this.lang.set(lang);
    this.writeStored(lang);
    const html = this.document.documentElement;
    if (html) {
      html.lang = toScope(lang);
    }
  }

  private readStored(): Lang | null {
    const storage = this.safeStorage();
    const value = storage?.getItem(STORAGE_KEY);
    return value && (LANGUAGES as readonly string[]).includes(value) ? (value as Lang) : null;
  }

  private writeStored(lang: Lang): void {
    this.safeStorage()?.setItem(STORAGE_KEY, lang);
  }

  /** `localStorage` is undefined during SSR; guard every access. */
  private safeStorage(): Storage | null {
    try {
      return typeof localStorage !== 'undefined' ? localStorage : null;
    } catch {
      return null;
    }
  }
}
