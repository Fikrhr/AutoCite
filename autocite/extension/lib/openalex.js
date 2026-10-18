// Cadangan gratis tanpa API key: OpenAlex. Dipakai saat Semantic Scholar membatasi permintaan (429).
const BASE = "https://api.openalex.org/works";
const SELECT = "id,title,publication_year,authorships,doi,primary_location,cited_by_count";

export async function searchOpenAlex(query, limit = 5) {
  const url = `${BASE}?search=${encodeURIComponent(query)}&per-page=${limit}&select=${SELECT}`;
  const res = await fetch(url);
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
