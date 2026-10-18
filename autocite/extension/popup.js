// Panel samping AutoCite. Keadaan terakhir (teks, hasil, pesan) disimpan, jadi tetap ada saat popup dibuka lagi.
const $ = (id) => document.getElementById(id);
const send = (msg) => chrome.runtime.sendMessage(msg);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const STATE_KEY = "panelState";

let searchedText = ""; // teks yang dipakai pada pencarian terakhir
let lastResults = [];  // hasil pencarian terakhir (untuk dipulihkan)

// ---------- Penyimpanan keadaan ----------
async function saveState() {
  try {
    await chrome.storage.local.set({
      [STATE_KEY]: { text: $("text").value, searchedText, results: lastResults, status: $("status").textContent },
    });
  } catch (_) {}
}

async function restoreState() {
  const { [STATE_KEY]: st } = await chrome.storage.local.get(STATE_KEY);
  if (!st) return false;
  $("text").value = st.text || "";
  searchedText = st.searchedText || "";
  lastResults = st.results || [];
  $("status").textContent = st.status || "";
  showResults(lastResults);
  return !!st.text;
}

function showResults(list) {
  $("results").innerHTML = "";
  list.forEach((r) => $("results").appendChild(card(r)));
  $("results-wrap").hidden = !list.length;
}

// ---------- Akun ----------
async function init() {
  const { user } = await chrome.storage.local.get("user");
  render(user);
  if (!user) return;
  const hadText = await restoreState();
  const { searching, searchResult, insertResult } = await chrome.storage.local.get(["searching", "searchResult", "insertResult"]);
  if (searching) $("status").textContent = "Mencari referensi... (hasil akan muncul otomatis)";
  else if (searchResult) applySearchResult(searchResult);
  if (insertResult) applyInsertResult(insertResult);
  if (!hadText) await grabSelection(true);
}

function render(user) {
  $("login-section").hidden = !!user;
  $("main-section").hidden = !user;
  $("account").innerHTML = user ? `<span>${esc(user.email)}</span> <button id="btn-logout" class="btn outline small">Keluar</button>` : "";
  if (user) {
    $("btn-logout").onclick = async () => { await send({ type: "LOGOUT" }); render(null); };
    refreshQuota();
  }
}

async function refreshQuota() {
  const q = await send({ type: "QUOTA" });
  $("quota").textContent = `Kuota hari ini: ${q.limit - q.used} dari ${q.limit} pencarian tersisa (akun Free).`;
}

// ---------- Mengambil teks yang dipilih di Docs ----------
async function activeDocsTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab?.url?.startsWith("https://docs.google.com/document") ? tab : null;
}

async function grabSelection(silent) {
  const tab = await activeDocsTab();
  if (!tab) { if (!silent) $("status").textContent = "Buka dokumen Google Docs di tab aktif."; return false; }

  // 1) Baca seleksi langsung dari halaman (sering kosong karena Docs memakai canvas).
  try {
    const res = await chrome.tabs.sendMessage(tab.id, { type: "GET_SELECTION" });
    if (res?.text) return setText(res.text, "Teks diambil dari seleksi di Docs.");
  } catch (_) {}

  // 2) Picu perintah "salin" di Docs dan tangkap teksnya langsung (tanpa lewat clipboard).
  try {
    const [out] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      world: "MAIN",
      func: () => {
        try {
          const f = document.querySelector(".docs-texteventtarget-iframe");
          if (!f) return "";
          const w = f.contentWindow, d = f.contentDocument;
          const proto = w.DataTransfer.prototype, orig = proto.setData;
          let got = "";
          proto.setData = function (t, v) { if (t === "text/plain") got = v; return orig.call(this, t, v); };
          try { w.focus(); d.execCommand("copy"); } finally { proto.setData = orig; }
          return got;
        } catch (e) { return ""; }
      },
    });
    if (out?.result && out.result.trim().length >= 5) return setText(out.result, "Teks diambil dari seleksi di Docs.");
  } catch (_) {}

  // 3) Cadangan: isi dari clipboard (pengguna menekan Ctrl+C sendiri).
  try {
    const t = (await navigator.clipboard.readText()).trim();
    if (t.length >= 15) return setText(t, "Teks diambil dari clipboard.");
  } catch (_) {}

  if (!silent) $("status").textContent = "Belum ada teks terbaca. Blok teks di Docs, tekan Ctrl+C, lalu klik tombol ini lagi, atau tempel manual.";
  return false;
}

function setText(text, msg) {
  $("text").value = text.trim();
  $("status").textContent = msg;
  saveState();
  return true;
}

// ---------- Aksi ----------
$("btn-login").onclick = async () => {
  const res = await send({ type: "LOGIN" });
  if (res.error) { alert(res.error); return; }
  render(res.user);
  grabSelection(true);
};

$("btn-paste").onclick = () => grabSelection(false);
$("text").addEventListener("input", saveState);

let lastAppliedTs = 0;

function applySearchResult(sr) {
  if (!sr || sr.ts === lastAppliedTs) return;
  lastAppliedTs = sr.ts;
  if (sr.text) searchedText = sr.text;
  if (sr.error) { $("status").textContent = sr.error; saveState(); return; }
  const list = sr.results || [];
  const note = (sr.source === "OpenAlex" ? " [sumber: OpenAlex]" : "") + (sr.llmError ? ` (${sr.llmError})` : "");
  $("status").textContent = (list.length ? `Kueri: "${sr.query}"` : `Tidak ada referensi untuk kueri "${sr.query}". Coba teks lain atau lebih umum.`) + note;
  lastResults = list;
  showResults(lastResults);
  refreshQuota();
  saveState();
}

function insertMessage(res) {
  if (res.ok) return `Sitasi ${res.insertion} disisipkan setelah kalimat ${res.sentenceNo ?? "yang dipilih"}.`;
  const why = res.error;
  let msg;
  if (why === "API_DISABLED") msg = "Google Docs API belum aktif di Google Cloud (APIs & Services → Library → Google Docs API → Enable).";
  else if (why === "SCOPE" || why?.startsWith("NO_ACCESS")) msg = `Izin mengedit Google Docs belum diberikan atau akun tidak punya akses edit ke dokumen. Detail: ${why}`;
  else if (why === "NOT_FOUND") msg = "Teks tidak ditemukan di dokumen (mungkin sudah diubah). Klik 'Ambil teks terpilih' lagi, cari ulang, lalu sisipkan.";
  else msg = `Gagal menyisipkan: ${why || "tanpa respons"}.`;
  return `${msg} Sitasi disalin ke clipboard, tempel dengan Ctrl+V.`;
}

async function applyInsertResult(res) {
  if (!res) return;
  if (!res.ok) await navigator.clipboard.writeText(res.insertion || res.reference || "").catch(() => {});
  $("status").textContent = insertMessage(res);
  await chrome.storage.local.remove("insertResult");
  saveState();
}

// Hasil yang selesai di latar belakang (mis. popup sempat tertutup) langsung ditampilkan.
chrome.storage.onChanged.addListener((ch) => {
  if (ch.searchResult?.newValue) applySearchResult(ch.searchResult.newValue);
  if (ch.insertResult?.newValue) applyInsertResult(ch.insertResult.newValue);
});

$("btn-search").onclick = async () => {
  const text = $("text").value.trim();
  if (text.length < 15) { $("status").textContent = "Teks terlalu pendek. Tulis atau tempel minimal satu kalimat."; return; }
  searchedText = text;
  $("status").textContent = "Mencari referensi...";
  showResults([]);
  let res;
  try { res = await send({ type: "SEARCH", text }); } catch (e) { res = { error: String(e.message || e) }; }
  if (!res) { $("status").textContent = "Tidak ada respons dari ekstensi. Reload ekstensi di chrome://extensions lalu coba lagi."; return; }
  const { searchResult } = await chrome.storage.local.get("searchResult");
  applySearchResult(searchResult && searchResult.text === text ? searchResult : { ...res, text, ts: Date.now() });
};

function card(r) {
  const li = document.createElement("li");
  li.innerHTML = `<div class="t">${esc(r.title)}</div>
    <div class="m">${esc(r.authors[0] ?? "Anonim")}${r.authors.length > 1 ? " et al." : ""} ${r.year ?? "n.d."}</div>
    <label class="pos">Sisipkan setelah<select data-k="pos">${(r.sentences || []).map((s, i) => `<option value="${i}"${i === r.suggest ? " selected" : ""}>Kalimat ${i + 1}: ${esc(short(s))}</option>`).join("")}</select></label>
    <div class="actions"><button class="btn filled" data-k="in">Sisipkan Sitasi</button><button class="btn filled" data-k="ref">Salin Daftar Pustaka</button></div>
    <div class="actions second"><button class="btn outline" data-k="open">Buka Sumber Referensi</button></div>`;
  li.querySelector('[data-k="in"]').onclick = () => {
    const sel = li.querySelector('[data-k="pos"]');
    const idx = sel ? Number(sel.value) : 0;
    insertIntoDoc(r.inText, r.sentences?.[idx] || searchedText, idx + 1);
  };
  li.querySelector('[data-k="ref"]').onclick = () => copy(r.reference);
  li.querySelector('[data-k="open"]').onclick = () => { if (r.url) chrome.tabs.create({ url: r.url }); };
  return li;
}

async function insertIntoDoc(inText, needle, sentenceNo) {
  const tab = await activeDocsTab();
  const m = tab?.url?.match(/^https:\/\/docs\.google\.com\/document\/d\/([\w-]+)/);
  if (!m) { await copy(inText); return; }
  $("status").textContent = "Menyisipkan sitasi... (jika muncul jendela izin Google, setujui dulu)";
  // Hasilnya juga disimpan di storage oleh background, jadi tetap muncul walau popup tertutup oleh jendela izin.
  const res = await send({ type: "INSERT", docId: m[1], needle, insertion: inText });
  if (res) await applyInsertResult({ ...res, insertion: inText, sentenceNo });
}

async function copy(text) {
  await navigator.clipboard.writeText(text);
  $("status").textContent = "Disalin. Tempel (Ctrl+V) di bagian Daftar Pustaka.";
}

function short(s) { const w = String(s).split(/\s+/); return w.slice(0, 6).join(" ") + (w.length > 6 ? "…" : ""); }

function esc(s) { return String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

init();
