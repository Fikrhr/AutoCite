// Cadangan gratis tanpa API key: OpenAlex. Dipakai saat Semantic Scholar membatasi permintaan (429).
const BASE = "https://api.openalex.org/works";
const SELECT = "id,title,publication_year,authorships,doi,primary_location,cited_by_count";

// Sejak Februari 2026 OpenAlex meminta API key gratis (openalex.org/settings/api); tanpa key hanya ada
// jatah kecil per hari (tiap pencarian memakai 10 kredit) lalu ditolak (409).
export async function searchOpenAlex(query, limit = 5, apiKey = "") {
  const url = `${BASE}?search=${encodeURIComponent(query)}&per-page=${limit}&select=${SELECT}` + (apiKey ? `&api_key=${encodeURIComponent(apiKey)}` : "");
  const res = await fetch(url, { signal: AbortSignal.timeout(7000) });
  if ([402, 403, 409, 429].includes(res.status)) throw new Error("OPENALEX_LIMIT");
  if (!res.ok) throw new Error(`OpenAlex error ${res.status}`);
  const json = await res.json();
  // Samakan bentuknya dengan hasil Semantic Scholar.
  return (json.results || []).filter((w) => w.title).map((w) => ({
    paperId: w.id,
    title: w.title,
    year: w.publication_year,
    venue: w.primary_location?.source?.display_name || "",
    url: w.doi || w.primary_location?.landing_page_url || w.id,
    authors: (w.authorships || []).map((a) => ({ name: a.author?.display_name || "" })).filter((a) => a.name),
    externalIds: w.doi ? { DOI: w.doi.replace(/^https?:\/\/doi\.org\//, "") } : {},
  }));
}
