const BASE = "https://api.semanticscholar.org/graph/v1/paper/search";
const FIELDS = "title,authors,year,venue,externalIds,url,abstract,citationCount";

// Cari paper berdasarkan kueri (hasil ekstraksi klaim). Gratis tanpa API key (ada rate limit).
export async function searchPapers(query, limit = 5) {
  const url = `${BASE}?query=${encodeURIComponent(query)}&limit=${limit}&fields=${FIELDS}`;
  const res = await fetch(url);
  if (res.status === 429) throw new Error("Semantic Scholar sedang membatasi permintaan. Coba lagi sebentar.");
  if (!res.ok) throw new Error(`Semantic Scholar error ${res.status}`);
  const json = await res.json();
  return json.data || [];
}
