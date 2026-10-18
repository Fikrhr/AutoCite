// Memecah paragraf menjadi kalimat (aman untuk singkatan umum bahasa Indonesia/Inggris).
const ABBR = /\b(dkk|dsb|dll|dst|dtk|yg|dg|spt|mis|no|al|vs|dr|prof|ir|hlm|gb|tb|mr|mrs|ms|sdr|bpk|ibu|jl|kab|kec|st)\.(?=\s)/gi;
const MARK = "\u0001";

export function splitSentences(text) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (!clean) return [];
  const protectedText = clean
    .replace(ABBR, (m) => m.slice(0, -1) + MARK)
    .replace(/\b(e\.g|i\.e)\.(?=\s)/gi, (m) => m.slice(0, -1) + MARK);
  const parts = protectedText.split(/(?<=[.!?])\s+(?=[A-Z0-9"“(])/);
  return parts.map((s) => s.split(MARK).join(".").trim()).filter((s) => s.length > 0);
}
