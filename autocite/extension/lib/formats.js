// Pemformat sitasi: APA 7, MLA 9, IEEE, Harvard (UC-06). Tanpa dependensi.
// Bentuk data: { title, year, venue, url, doi, authors: ["Nama Lengkap", ...] }
import { formatReference as apaRef, formatInText as apaIn } from "./apa.js";

export const FORMATS = { apa: "APA 7", mla: "MLA 9", ieee: "IEEE", harvard: "Harvard" };

const parts = (n) => {
  const p = String(n || "").trim().split(/\s+/).filter(Boolean);
  return { last: p[p.length - 1] || "", given: p.slice(0, -1) };
};
const initials = (given, dots, sep) => given.map((g) => g[0].toUpperCase() + (dots ? "." : "")).join(sep);
const yearOf = (p) => p.year || "n.d.";
const linkOf = (p) => (p.doi ? `https://doi.org/${p.doi}` : p.url || "");
const names = (p) => (p.authors || []).filter(Boolean);
const endDot = (s) => (/[.!?]$/.test(s) ? s : s + ".");

function toApa(p) {
  return {
    title: p.title, year: p.year, venue: p.venue, url: p.url,
    authors: names(p).map((name) => ({ name })),
    externalIds: p.doi ? { DOI: p.doi } : {},
  };
}

// ---------- MLA 9 ----------
function mlaAuthors(p) {
  const a = names(p);
  if (!a.length) return "";
  const first = parts(a[0]);
  const inv = `${first.last}, ${first.given.join(" ")}`.replace(/,\s*$/, "");
  if (a.length === 1) return inv;
  if (a.length === 2) return `${inv}, and ${a[1]}`;
  return `${inv}, et al.`;
}
function mlaRef(p) {
  const au = mlaAuthors(p);
  const tail = [p.venue, yearOf(p), linkOf(p)].filter(Boolean).join(", ");
  return `${au ? endDot(au) + " " : ""}"${p.title}." ${endDot(tail)}`.replace(/\s+/g, " ").trim();
}
function mlaIn(p) {
  const a = names(p).map((n) => parts(n).last);
  if (!a.length) return `("${p.title}")`;
  if (a.length === 1) return `(${a[0]})`;
  if (a.length === 2) return `(${a[0]} and ${a[1]})`;
  return `(${a[0]} et al.)`;
}

// ---------- IEEE ----------
function ieeeAuthors(p) {
  const a = names(p).map((n) => { const x = parts(n); return `${initials(x.given, true, " ")} ${x.last}`.trim(); });
  if (!a.length) return "";
  if (a.length > 6) return `${a[0]} et al.`;
  if (a.length === 1) return a[0];
  if (a.length === 2) return `${a[0]} and ${a[1]}`;
  return a.slice(0, -1).join(", ") + ", and " + a[a.length - 1];
}
function ieeeRef(p, n) {
  const au = ieeeAuthors(p);
  const tail = [p.venue, yearOf(p), linkOf(p)].filter(Boolean).join(", ");
  return `[${n}] ${au ? au + ", " : ""}"${p.title}," ${endDot(tail)}`.replace(/\s+/g, " ").trim();
}

// ---------- Harvard ----------
function harvardAuthors(p) {
  const a = names(p).map((n) => { const x = parts(n); return `${x.last}, ${initials(x.given, true, "")}`.replace(/,\s*$/, ""); });
  if (!a.length) return "";
  if (a.length > 3) return `${a[0]} et al.`;
  if (a.length === 1) return a[0];
  return a.slice(0, -1).join(", ") + " and " + a[a.length - 1];
}
function harvardRef(p) {
  const au = harvardAuthors(p);
  let s = `${au || p.title} (${yearOf(p)})`;
  if (au) s += ` '${p.title}'` + (p.venue ? `, ${p.venue}.` : ".");
  else s += ".";
  const link = linkOf(p);
  if (link) s += ` Available at: ${link}.`;
  return s.replace(/\s+/g, " ").trim();
}
function harvardIn(p) {
  const a = names(p).map((n) => parts(n).last);
  const y = yearOf(p);
  if (!a.length) return `(${p.title}, ${y})`;
  if (a.length === 1) return `(${a[0]}, ${y})`;
  if (a.length === 2) return `(${a[0]} and ${a[1]}, ${y})`;
  return `(${a[0]} et al., ${y})`;
}

// n = nomor urut (dipakai IEEE: [1], [2], ...)
export function formatReference(p, fmt = "apa", n = 1) {
  if (fmt === "mla") return mlaRef(p);
  if (fmt === "ieee") return ieeeRef(p, n);
  if (fmt === "harvard") return harvardRef(p);
  return apaRef(toApa(p));
}

export function formatInText(p, fmt = "apa", n = 1) {
  if (fmt === "mla") return mlaIn(p);
  if (fmt === "ieee") return `[${n}]`;
  if (fmt === "harvard") return harvardIn(p);
  return apaIn(toApa(p));
}
