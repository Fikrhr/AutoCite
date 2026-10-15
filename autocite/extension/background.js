import { extractQuery } from "./lib/llm.js";
import { searchPapers } from "./lib/semanticscholar.js";
import { formatReference, formatInText } from "./lib/apa.js";
import { canSearch, consume, getQuota, FREE_DAILY_LIMIT } from "./lib/quota.js";

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
  const { geminiKey } = await chrome.storage.local.get("geminiKey");
  const query = await extractQuery(text, geminiKey);
  const papers = await searchPapers(query, 5);
  const remaining = await consume();
  const results = papers.map((p) => ({
    paperId: p.paperId,
    title: p.title,
    year: p.year,
    venue: p.venue,
    url: p.url,
    authors: (p.authors || []).map((a) => a.name),
    reference: formatReference(p),
    inText: formatInText(p),
  }));
  return { query, results, remaining };
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    try {
      if (msg.type === "LOGIN") sendResponse({ user: await login() });
      else if (msg.type === "LOGOUT") { await logout(); sendResponse({ ok: true }); }
      else if (msg.type === "SEARCH") sendResponse(await search(msg.text));
      else if (msg.type === "QUOTA") sendResponse({ ...(await getQuota()), limit: FREE_DAILY_LIMIT });
    } catch (e) {
      sendResponse({ error: e.message });
    }
  })();
  return true; // respons asinkron
});
