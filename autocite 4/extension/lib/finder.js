// Pencarian paper dari tiga sumber BERSAMAAN: Semantic Scholar, OpenAlex, dan Crossref (tanpa key).
// Kueri dibuat bertingkat (panjang -> pendek) supaya hampir selalu ada hasil.
import { keywordQuery, topWords } from "./llm.js";
import { searchPapers } from "./semanticscholar.js";
import { searchOpenAlex } from "./openalex.js";
import { searchCrossref } from "./crossref.js";
import { toEnglish, looksIndonesian } from "./translate.js";

const norm = (t) => String(t || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

// llmQuery: kueri bahasa Inggris dari Gemini (kosong bila tidak ada).
export async function findPapers({ text, llmQuery, count, s2Key, oaKey }) {
  const kw10 = keywordQuery(text) || text.slice(0, 120);
  const base = llmQuery || kw10;
  const ladder = [...new Set([base, kw10, topWords(text, 6), topWords(text, 4), topWords(text, 3)].filter(Boolean))];

  // Tanpa Gemini: terjemahkan kata kunci ke Inggris (jika teks berbahasa Indonesia).
  const enPromise = !llmQuery && looksIndonesian(text) ? toEnglish(topWords(text, 8)) : Promise.resolve("");

  const notes = new Set();
  const explain = (src, e) => {
    const m = String(e?.message || e);
    if (src === "s2" && /429/.test(m)) notes.add("Semantic Scholar sedang membatasi permintaan (isi API key-nya di Pengaturan)");
    else if (m === "OPENALEX_LIMIT") notes.add("OpenAlex menolak permintaan: isi API key OpenAlex gratis di Pengaturan");
    else if (m === "CROSSREF_LIMIT") notes.add("Crossref sedang membatasi permintaan, coba lagi sebentar");
  };

  // Tiap pekerjaan mengembalikan { src, q, pr, p } atau null bila dilewati (pr kecil = diutamakan).
  const jobs = [
    ["s2", async () => { const q = (await enPromise) || base; return { src: "Semantic Scholar", q, pr: 0, p: await searchPapers(q, count, s2Key) }; }],
    ["oa", async () => { const q = await enPromise; return q ? { src: "OpenAlex", q, pr: 0.5, p: await searchOpenAlex(q, count, oaKey) } : null; }],
    // Crossref: kueri bertingkat berurutan (batas laju publiknya ketat), berhenti di hasil pertama.
    ["cr", async () => {
      const en = await enPromise;
      for (const q of [...new Set([en, ...ladder].filter(Boolean))]) {
        const p = await searchCrossref(q, count);
        if (p.length) return { src: "Crossref", q, pr: 5, p };
      }
      return { src: "Crossref", q: base, pr: 5, p: [] };
    }],
  ];
  // OpenAlex: tanpa key cukup satu permintaan (jatah harian kecil); dengan key, kueri bertingkat paralel.
  if (oaKey) ladder.forEach((q, i) => jobs.push(["oa", async () => ({ src: "OpenAlex", q, pr: i + 1, ladder: true, p: await searchOpenAlex(q, count, oaKey) })]));
  else jobs.push(["oa", async () => ({ src: "OpenAlex", q: base, pr: 1, ladder: true, p: await searchOpenAlex(base, count, oaKey) })]);

  let failed = 0, attempted = 0;
  const done = await Promise.all(jobs.map(([src, j]) =>
    j().then((r) => { if (r) attempted++; return r; }).catch((e) => { failed++; attempted++; explain(src, e); return null; })));

  const hits = done.filter((d) => d && d.p.length).sort((a, b) => a.pr - b.pr);
  if (!hits.length && failed === attempted)
    throw new Error("Tidak bisa menghubungi sumber referensi mana pun. " + ([...notes].join("; ") || "Periksa koneksi internet lalu coba lagi."));

  // Pakai satu kueri bertingkat OpenAlex (yang terpanjang yang berhasil); sumber lain dipakai penuh.
  const firstLadder = hits.find((h) => h.ladder);
  const picked = hits.filter((h) => !h.ladder || h === firstLadder);

  const papers = [], used = new Set(), sources = new Set();
  for (const h of picked) {
    for (const p of h.p) {
      const k = norm(p.title);
      if (!k || used.has(k) || papers.length >= count) continue;
      used.add(k); papers.push(p); sources.add(h.src);
    }
  }
  return { papers, query: picked[0]?.q || base, source: [...sources].join(" + ") || "-", notes: papers.length ? [] : [...notes] };
}
