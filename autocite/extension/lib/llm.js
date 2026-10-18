// Ekstraksi klaim/kata kunci pencarian dari teks terpilih memakai Gemini (ada free tier).
// API key disimpan di chrome.storage (diisi lewat halaman Opsi), TIDAK ditulis di kode.
const MODELS = ["gemini-flash-latest", "gemini-2.0-flash", "gemini-1.5-flash"];

const STOP = new Set(("yang dan di ke dari untuk pada dengan dalam adalah ini itu atau sebuah tidak juga akan agar serta oleh " +
  "karena sehingga dapat bisa para saat sebagai lebih telah sudah mereka kami kita nya meski demikian namun tetapi " +
  "the a an of in on for to and or is are was were be by with as at from that this it its").split(" "));

// Kueri cadangan tanpa LLM: ambil kata kunci terpanjang yang unik (maks. 10 kata).
export function keywordQuery(text) {
  const words = (text.toLowerCase().match(/[a-zà-ÿ0-9-]{4,}/g) || []).filter((w) => !STOP.has(w));
  const uniq = [...new Set(words)];
  return uniq.sort((a, b) => b.length - a.length).slice(0, 10).join(" ");
}

// Mengembalikan { query, error }. error terisi bila Gemini gagal (kueri tetap dikembalikan lewat cadangan).
export async function extractQuery(text, apiKey) {
  const fallback = keywordQuery(text) || text.slice(0, 120);
  if (!apiKey) return { query: fallback, error: "Gemini API key belum diisi (Pengaturan), memakai kata kunci sederhana." };
  const prompt =
    "Dari teks akademik berikut, tulis SATU kueri pencarian jurnal dalam bahasa Inggris " +
    "(maksimal 12 kata) yang menangkap klaim utamanya. Jawab hanya kueri, tanpa tanda kutip.\n\nTeks:\n" + text.slice(0, 3000);
  let lastErr = "";
  for (const model of MODELS) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) }
      );
      if (!res.ok) { lastErr = `Gemini ${res.status}`; continue; }
      const json = await res.json();
      const out = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (out) return { query: out.replace(/["\n]/g, " ").trim() };
      lastErr = "Gemini tidak mengembalikan teks";
    } catch (e) {
      lastErr = String(e.message || e);
    }
  }
  return { query: fallback, error: `${lastErr}. Memakai kata kunci sederhana.` };
}

// Tentukan, untuk setiap paper, nomor kalimat (mulai 0) yang paling didukung paper tersebut.
// Mengembalikan array angka atau null jika gagal (pemanggil memakai nilai bawaan).
export async function mapPapersToSentences(sentences, papers, apiKey) {
  if (!apiKey || sentences.length < 2 || !papers.length) return null;
  const sList = sentences.map((s, i) => `${i}: ${s}`).join("\n");
  const pList = papers.map((p, i) => `${i}: ${p.title}${p.abstract ? " | " + p.abstract.slice(0, 300) : ""}`).join("\n");
  const prompt =
    "Berikut kalimat-kalimat dari sebuah paragraf (bernomor dari 0) dan daftar paper (bernomor dari 0).\n" +
    "Untuk setiap paper, pilih nomor SATU kalimat yang paling didukung oleh isi paper tersebut.\n" +
    "Jawab hanya JSON array angka dengan panjang sama dengan jumlah paper, urut sesuai nomor paper.\n\n" +
    `Kalimat:\n${sList}\n\nPaper:\n${pList}`;
  for (const model of MODELS) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } }) }
      );
      if (!res.ok) continue;
      const json = await res.json();
      const raw = json.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const arr = JSON.parse(raw.replace(/```json|```/g, "").trim());
      if (Array.isArray(arr) && arr.length === papers.length)
        return arr.map((n) => (Number.isInteger(n) && n >= 0 && n < sentences.length ? n : sentences.length - 1));
    } catch (_) { /* coba model berikutnya */ }
  }
  return null;
}
