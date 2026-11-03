// Pemformat APA 7 sederhana (tanpa dependensi). Nanti bisa diganti Citation.js untuk MLA/Chicago/IEEE (fitur premium).

function formatAuthor(name) {
  const parts = String(name || "").trim().split(/\s+/);
  if (parts.length < 2) return parts[0] || "";
  const last = parts[parts.length - 1];
  const initials = parts.slice(0, -1).map((p) => p[0].toUpperCase() + ".").join(" ");
  return `${last}, ${initials}`;
}

export function formatAuthors(authors) {
  const names = (authors || []).map((a) => formatAuthor(a.name)).filter(Boolean);
  if (names.length === 0) return "";
  if (names.length === 1) return names[0];
  if (names.length <= 20) return names.slice(0, -1).join(", ") + ", & " + names[names.length - 1];
  return names.slice(0, 19).join(", ") + ", ... " + names[names.length - 1];
}

// Daftar pustaka APA
export function formatReference(paper) {
  const authors = formatAuthors(paper.authors) || paper.title;
  const year = paper.year ? `(${paper.year})` : "(n.d.)";
  const doi = paper.externalIds && paper.externalIds.DOI;
  const link = doi ? `https://doi.org/${doi}` : paper.url || "";
  const venue = paper.venue ? ` ${paper.venue}.` : "";
  const title = paper.authors && paper.authors.length ? ` ${paper.title}.` : "";
  return `${authors} ${year}.${title}${venue} ${link}`.replace(/\s+/g, " ").trim();
}

// Sitasi dalam teks: (Nama, 2023) / (A & B, 2023) / (A et al., 2023)
export function formatInText(paper) {
  const last = (a) => String(a.name || "").trim().split(/\s+/).pop();
  const au = paper.authors || [];
  const year = paper.year || "n.d.";
  if (au.length === 0) return `(${paper.title}, ${year})`;
  if (au.length === 1) return `(${last(au[0])}, ${year})`;
  if (au.length === 2) return `(${last(au[0])} & ${last(au[1])}, ${year})`;
  return `(${last(au[0])} et al., ${year})`;
}
