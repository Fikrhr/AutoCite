import { extractQuery, mapPapersToSentences } from "./lib/llm.js";
import { findPapers } from "./lib/finder.js";
import { splitSentences } from "./lib/sentences.js";
import { formatReference, formatInText } from "./lib/apa.js";
import { insertCitation } from "./lib/docs.js";
import { canSearch, consume, getQuota, FREE_DAILY_LIMIT } from "./lib/quota.js";
import { isPremium } from "./lib/plan.js";

// Klik ikon ekstensi membuka panel samping.
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});

function getToken(interactive) {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive }, (token) => {
      if (chrome.runtime.lastError || !token) reject(new Error(chrome.runtime.lastError?.message || "Login gagal"));
      else resolve(token);
    });
  });
}

async function login() {
  const token = await getToken(true);
  const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const user = await res.json();
  await chrome.storage.local.set({ user: { email: user.email, name: user.name } });
  return { email: user.email, name: user.name };
}

async function logout() {
  try {
    const token = await getToken(false);
    // Cabut izin di Google (bukan hanya hapus cache), supaya login berikutnya tidak otomatis memakai akun lama.
    await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, { method: "POST" }).catch(() => {});
    await new Promise((r) => chrome.identity.removeCachedAuthToken({ token }, r));
  } catch (_) {}
  await new Promise((r) => (chrome.identity.clearAllCachedAuthTokens ? chrome.identity.clearAllCachedAuthTokens(r) : r()));
  // Data milik akun sebelumnya (hasil, riwayat) dibersihkan agar tidak terlihat oleh akun berikutnya.
  await chrome.storage.local.remove(["user", "panelState", "searchResult", "searching", "insertResult", "history"]);
}

async function search(text) {
  const premium = await isPremium();
  if (!premium && !(await canSearch())) {
    return { error: `Kuota harian (${FREE_DAILY_LIMIT} pencarian) habis. Upgrade ke Premium untuk tanpa batas.` };
  }
  const { geminiKey, s2Key, oaKey, prefs } = await chrome.storage.local.get(["geminiKey", "s2Key", "oaKey", "prefs"]);
  const count = Math.min(Math.max(Number(prefs?.count) || 5, 1), 10); // jumlah hasil (UC-09)
  const { query: q1, error: llmError } = await extractQuery(text, geminiKey);

  // Semantic Scholar dan OpenAlex dicari bersamaan, dengan kueri bertingkat (lihat lib/finder.js).
  const { papers, query, source, notes } = await findPapers({ text, llmQuery: geminiKey && !llmError ? q1 : "", count, s2Key, oaKey });

  // Kuota hanya terpakai bila pencarian benar-benar menghasilkan referensi.
  if (papers.length && !premium) await consume(); // Premium: tanpa batas
  const { used, limit } = { ...(await getQuota()), limit: FREE_DAILY_LIMIT };
  const remaining = limit - used;
  const sentences = splitSentences(text);
  // Posisi sitasi: kalimat yang paling didukung tiap paper (Gemini); bawaan: kalimat terakhir.
  const mapping = await mapPapersToSentences(sentences, papers, geminiKey);
  const results = papers.map((p, i) => ({
    paperId: p.paperId,
    title: p.title,
    year: p.year,
    venue: p.venue,
    url: p.url,
    authors: (p.authors || []).map((a) => a.name),
    doi: p.externalIds?.DOI || "",
    reference: formatReference(p),
    inText: formatInText(p),
    sentences,
    suggest: mapping ? mapping[i] : Math.max(sentences.length - 1, 0),
  }));
  return { query, results, remaining, llmError, source, notes };
}

// Riwayat pencarian (UC-08): 20 terakhir, yang terbaru di atas; teks yang sama tidak digandakan.
async function pushHistory(entry) {
  const { history = [] } = await chrome.storage.local.get("history");
  const next = [entry, ...history.filter((h) => h.text !== entry.text)].slice(0, 20);
  await chrome.storage.local.set({ history: next });
}

// Hasil pencarian selalu disimpan, sehingga tetap ada walau popup ditutup sebelum selesai.
async function searchAndStore(text) {
  await chrome.storage.local.set({ searching: true });
  try {
    const r = await search(text);
    const ts = Date.now();
    await chrome.storage.local.set({ searching: false, searchResult: { text, ...r, ts } });
    if (r.results?.length) await pushHistory({ ts, text, query: r.query, source: r.source, results: r.results });
    return r;
  } catch (e) {
    await chrome.storage.local.set({ searching: false, searchResult: { text, error: e.message, ts: Date.now() } });
    throw e;
  }
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    try {
      if (msg.type === "LOGIN") sendResponse({ user: await login() });
      else if (msg.type === "LOGOUT") { await logout(); sendResponse({ ok: true }); }
      else if (msg.type === "SEARCH") sendResponse(await searchAndStore(msg.text));
      else if (msg.type === "INSERT") {
        try {
          // Pakai token yang sudah tersimpan (tanpa jendela login). Jendela hanya muncul bila belum ada izin sama sekali.
          let token = await getToken(false).catch(() => getToken(true));
          try {
            await insertCitation(token, msg.docId, msg.needle, msg.insertion);
          } catch (e) {
            // Token kedaluwarsa/tanpa izin Docs (401): buang dan coba sekali lagi dengan token baru.
            if (e.message !== "SCOPE") throw e;
            await new Promise((r) => chrome.identity.removeCachedAuthToken({ token }, r));
            token = await getToken(true);
            await insertCitation(token, msg.docId, msg.needle, msg.insertion);
          }
          await chrome.storage.local.set({ insertResult: { ok: true, insertion: msg.insertion, ts: Date.now() } });
          sendResponse({ ok: true });
        } catch (e) {
          // NO_ACCESS (403/404) berarti akun tidak punya akses edit ke dokumen, BUKAN masalah token: token jangan dibuang.
          await chrome.storage.local.set({ insertResult: { error: e.message, insertion: msg.insertion, ts: Date.now() } });
          sendResponse({ error: e.message });
        }
      }
      else if (msg.type === "QUOTA") sendResponse({ ...(await getQuota()), limit: FREE_DAILY_LIMIT, premium: await isPremium() });
    } catch (e) {
      sendResponse({ error: e.message });
    }
  })();
  return true; // respons asinkron
});
