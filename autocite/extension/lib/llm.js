// Ekstraksi klaim/kata kunci pencarian dari teks terpilih memakai Gemini (ada free tier).
// API key disimpan di chrome.storage (diisi lewat halaman Opsi), TIDAK ditulis di kode.
const MODEL = "gemini-2.0-flash";

export async function extractQuery(text, apiKey) {
  if (!apiKey) return fallbackQuery(text); // tanpa key: pakai teks apa adanya
  const prompt =
    "Dari teks akademik berikut, tulis SATU kueri pencarian jurnal dalam bahasa Inggris " +
    "(maksimal 12 kata) yang menangkap klaim utamanya. Jawab hanya kueri, tanpa tanda kutip.\n\nTeks:\n" + text;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );
    if (!res.ok) throw new Error(`LLM error ${res.status}`);
    const json = await res.json();
    const out = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    return out || fallbackQuery(text);
  } catch (e) {
    return fallbackQuery(text);
  }
}

function fallbackQuery(text) {
  return text.replace(/\s+/g, " ").trim().slice(0, 200);
}
