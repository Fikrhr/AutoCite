const BASE = "https://api.semanticscholar.org/graph/v1/paper/search";
const FIELDS = "title,authors,year,venue,externalIds,url,abstract,citationCount";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Cari paper berdasarkan kueri. Tanpa API key, kuota dibagi dengan semua pengguna publik
// sehingga sering kena 429; karena itu dicoba ulang beberapa kali. API key gratis sangat disarankan.
export async function searchPapers(query, limit = 5, apiKey = "") {
  const url = `${BASE}?query=${encodeURIComponent(query)}&limit=${limit}&fields=${FIELDS}`;
  const headers = apiKey ? { "x-api-key": apiKey } : {};
  const delays = [1500, 3500, 6000];
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, { headers });
    if (res.status === 429 && attempt < delays.length) {
      await sleep(delays[attempt]);
      continue;
    }
    if (res.status === 429) {
      throw new Error("Semantic Scholar sedang membatasi permintaan. Tunggu semenit lalu coba lagi, atau isi API key Semantic Scholar di Pengaturan.");
    }
    if (!res.ok) throw new Error(`Semantic Scholar error ${res.status}`);
    const json = await res.json();
    return json.data || [];
  }
}
