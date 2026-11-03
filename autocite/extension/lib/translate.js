// Terjemahan Indonesia -> Inggris gratis tanpa API key (MyMemory), hanya untuk kata kunci pendek.
// Dipakai saat Gemini tidak ada, karena sebagian besar jurnal terindeks berbahasa Inggris.
const ID_HINT = /\b(yang|dan|untuk|dengan|adalah|dalam|pada|dari|bisa|dapat|sampai|tidak|akan|oleh|karena)\b/i;
export const looksIndonesian = (text) => ID_HINT.test(text);

export async function toEnglish(keywords) {
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(keywords)}&langpair=id|en`;
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return "";
    const t = String((await res.json())?.responseData?.translatedText || "").trim();
    if (!t || t.length > 200 || /MYMEMORY|INVALID|QUERY LENGTH|PLEASE/i.test(t)) return "";
    return t.toLowerCase() === keywords.toLowerCase() ? "" : t;
  } catch (_) {
    return "";
  }
}
