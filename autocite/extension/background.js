import { extractQuery, keywordQuery, mapPapersToSentences } from "./lib/llm.js";
import { splitSentences } from "./lib/sentences.js";
import { searchPapers } from "./lib/semanticscholar.js";
import { searchOpenAlex } from "./lib/openalex.js";
import { formatReference, formatInText } from "./lib/apa.js";
import { insertCitation } from "./lib/docs.js";
import { canSearch, consume, getQuota, FREE_DAILY_LIMIT } from "./lib/quota.js";

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
    await new Promise((r) => chrome.identity.removeCachedAuthToken({ token }, r));
  } catch (_) {}
  await chrome.storage.local.remove("user");
}

async function search(text) {
  if (!(await canSearch())) {
    return { error: `Kuota harian (${FREE_DAILY_LIMIT} pencarian) habis. Upgrade ke Premium untuk tanpa batas.` };
  }
  const { geminiKey, s2Key } = await chrome.storage.local.get(["geminiKey", "s2Key"]);
  const { query: q1, error: llmError } = await extractQuery(text, geminiKey);
  let query = q1;
  let source = "Semantic Scholar";

  // Coba Semantic Scholar; jika dibatasi (429) atau gagal, pakai OpenAlex sebagai cadangan.
  const find = async (q) => {
    try {
      return await searchPapers(q, 5, s2Key);
    } catch (e) {
      source = "OpenAlex";
      return await searchOpenAlex(q, 5);
    }
  };

  let papers = await find(query);
  if (!papers.length) {
    // Kueri terlalu spesifik: coba lagi dengan kata kunci yang lebih sedikit.
    const shorter = keywordQuery(query).split(" ").slice(0, 5).join(" ");
    if (shorter && shorter !== query) {
      if (s2Key) await new Promise((r) => setTimeout(r, 1100)); // batas 1 permintaan/detik dengan API key
      query = shorter; papers = await find(query);
    }
  }
  const remaining = await consume();
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
    reference: formatReference(p),
    inText: formatInText(p),
    sentences,
    suggest: mapping ? mapping[i] : Math.max(sentences.length - 1, 0),
  }));
  return { query, results, remaining, llmError, source };
}

// Hasil pencarian selalu disimpan, sehingga tetap ada walau popup ditutup sebelum selesai.
async function searchAndStore(text) {
  await chrome.storage.local.set({ searching: true });
  try {
    const r = await search(text);
    await chrome.storage.local.set({ searching: false, searchResult: { text, ...r, ts: Date.now() } });
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
          const token = await getToken(true);
          await insertCitation(token, msg.docId, msg.needle, msg.insertion);
          await chrome.storage.local.set({ insertResult: { ok: true, insertion: msg.insertion, ts: Date.now() } });
          sendResponse({ ok: true });
        } catch (e) {
          // Token lama mungkin tanpa izin Docs: buang dari cache agar login berikutnya meminta izin baru.
          if (e.message === "SCOPE" || e.message.startsWith("NO_ACCESS")) {
            try { const t = await getToken(false); await new Promise((r) => chrome.identity.removeCachedAuthToken({ token: t }, r)); } catch (_) {}
          }
          await chrome.storage.local.set({ insertResult: { error: e.message, insertion: msg.insertion, ts: Date.now() } });
          sendResponse({ error: e.message });
        }
      }
      else if (msg.type === "QUOTA") sendResponse({ ...(await getQuota()), limit: FREE_DAILY_LIMIT });
    } catch (e) {
      sendResponse({ error: e.message });
    }
  })();
  return true; // respons asinkron
});
