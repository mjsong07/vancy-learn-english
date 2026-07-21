import type { ReviewItem } from "../types/review";

interface BrowserTranslator {
  translate(text: string): Promise<string>;
}

interface BrowserTranslatorFactory {
  create(options: {
    sourceLanguage: string;
    targetLanguage: string;
  }): Promise<BrowserTranslator>;
}

interface MyMemoryResponse {
  responseData?: {
    translatedText?: string;
  };
}

const translationCacheStorageKey = "kid-english-review-translations-v1";

function readTranslationCache() {
  try {
    const rawValue = window.localStorage.getItem(translationCacheStorageKey);
    return rawValue ? (JSON.parse(rawValue) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function writeTranslationCache(cache: Record<string, string>) {
  try {
    window.localStorage.setItem(translationCacheStorageKey, JSON.stringify(cache));
  } catch {
    // Translation still succeeds when private browsing or storage quotas block caching.
  }
}

function normalizeTranslationKey(text: string) {
  return text.trim().replace(/\\s+/g, " ").toLocaleLowerCase();
}

function getBrowserTranslatorFactory() {
  return (globalThis as typeof globalThis & { Translator?: BrowserTranslatorFactory }).Translator;
}

async function createBrowserTranslator() {
  const factory = getBrowserTranslatorFactory();
  if (!factory) return null;

  try {
    return await factory.create({ sourceLanguage: "en", targetLanguage: "zh" });
  } catch {
    return null;
  }
}

async function translateWithMyMemory(text: string) {
  const url = new URL("https://api.mymemory.translated.net/get");
  url.searchParams.set("q", text);
  url.searchParams.set("langpair", "en|zh-CN");

  const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error("Translation request failed: " + response.status);

  const payload = (await response.json()) as MyMemoryResponse;
  const translation = payload.responseData?.translatedText?.trim() || "";
  if (!translation || translation.toLocaleLowerCase() === text.toLocaleLowerCase()) {
    throw new Error("Translation result is empty");
  }
  return translation;
}

export async function translateReviewItems(items: ReviewItem[]) {
  const cache = readTranslationCache();
  const translator = await createBrowserTranslator();
  let failedCount = 0;

  const translatedItems: ReviewItem[] = [];
  for (const item of items) {
    if (item.chinese.trim()) {
      translatedItems.push(item);
      continue;
    }

    const key = normalizeTranslationKey(item.english);
    let chinese = cache[key] || "";

    if (!chinese && translator) {
      try {
        chinese = (await translator.translate(item.english)).trim();
      } catch {
        chinese = "";
      }
    }

    if (!chinese) {
      try {
        chinese = await translateWithMyMemory(item.english);
      } catch {
        failedCount += 1;
      }
    }

    if (chinese) cache[key] = chinese;
    translatedItems.push({ ...item, chinese });
  }

  writeTranslationCache(cache);
  return { items: translatedItems, failedCount };
}
