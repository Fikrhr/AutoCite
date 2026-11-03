const BASE = "https://api.semanticscholar.org/graph/v1/paper/search";
const FIELDS = "title,authors,year,venue,externalIds,url,abstract,citationCount";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Cari paper. Tanpa API key kuota dibagi dengan semua pengguna publik sehingga sering 429:
// langsung menyerah supaya pemanggil bisa beralih ke OpenAlex tanpa menunggu lama.
// Dengan API key, dicoba ulang satu kali setelah 1,2 detik.
export async function searchPapers(query, limit = 5, apiKey = "") {
  const url = `${BASE}?query=${encodeURIComponent(query)}&limit=${limit}&fields=${FIELDS}`;
  const headers = apiKey ? { "x-api-key": apiKey } : {};
  const retries = apiKey ? 1 : 0;
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(7000) });
    if (res.status === 429 && attempt < retries) { await sleep(1200); continue; }
    if (res.status === 429) throw new Error("Semantic Scholar sedang membatasi permintaan (429).");
    if (!res.ok) throw new Error(`Semantic Scholar error ${res.status}`);
    const json = await res.json();
    return json.data || [];
  }
}
