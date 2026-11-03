// Sumber ketiga: Crossref (gratis, tanpa API key, ratusan juta artikel jurnal termasuk jurnal Indonesia).
const SELECT = "DOI,title,author,issued,container-title,URL";

export async function searchCrossref(query, limit = 5) {
  const url = `https://api.crossref.org/works?query=${encodeURIComponent(query)}&filter=type:journal-article&rows=${limit}&select=${SELECT}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (res.status === 429) throw new Error("CROSSREF_LIMIT");
  if (!res.ok) throw new Error(`Crossref error ${res.status}`);
  const items = (await res.json()).message?.items || [];
  return items.filter((i) => i.title?.[0]).map((i) => ({
    paperId: i.DOI,
    title: i.title[0].replace(/<[^>]+>/g, "").trim(),
    year: i.issued?.["date-parts"]?.[0]?.[0] || null,
    venue: i["container-title"]?.[0] || "",
    url: i.URL || (i.DOI ? `https://doi.org/${i.DOI}` : ""),
    authors: (i.author || []).map((a) => ({ name: [a.given, a.family].filter(Boolean).join(" ") || a.name || "" })).filter((a) => a.name),
    externalIds: i.DOI ? { DOI: i.DOI } : {},
  }));
}
