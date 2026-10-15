const $ = (id) => document.getElementById(id);
const send = (msg) => chrome.runtime.sendMessage(msg);

async function init() {
  const { user } = await chrome.storage.local.get("user");
  render(user);
  if (user) await prefillSelection();
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

async function prefillSelection() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url?.startsWith("https://docs.google.com/document")) return;
    const res = await chrome.tabs.sendMessage(tab.id, { type: "GET_SELECTION" });
    if (res?.text) $("text").value = res.text;
  } catch (_) {}
}

$("btn-login").onclick = async () => {
  const res = await send({ type: "LOGIN" });
  if (res.error) { alert(res.error); return; }
  render(res.user);
  prefillSelection();
};

$("btn-search").onclick = async () => {
  const text = $("text").value.trim();
  if (text.length < 15) { $("status").textContent = "Teks terlalu pendek. Tulis atau tempel minimal satu kalimat."; return; }
  $("status").textContent = "Mencari referensi...";
  $("results").innerHTML = "";
  $("results-wrap").hidden = true;
  const res = await send({ type: "SEARCH", text });
  if (res.error) { $("status").textContent = res.error; return; }
  $("status").textContent = res.results.length ? `Kueri: "${res.query}"` : "Tidak ada referensi yang cocok.";
  res.results.forEach((r) => $("results").appendChild(card(r)));
  $("results-wrap").hidden = !res.results.length;
  refreshQuota();
};

function card(r) {
  const li = document.createElement("li");
  li.innerHTML = `<div class="t">${esc(r.title)}</div>
    <div class="m">${esc(r.authors[0] ?? "Anonim")}${r.authors.length > 1 ? " et al." : ""}, ${r.year ?? "n.d."}</div>
    <div class="actions"><button class="btn filled" data-k="in">Sisipkan Sitasi</button><button class="btn outline" data-k="open">Buka Sumber Referensi</button></div>
    <button class="ref" data-k="ref">Salin daftar pustaka (APA)</button>`;
  li.querySelector('[data-k="in"]').onclick = () => copy(r.inText);
  li.querySelector('[data-k="ref"]').onclick = () => copy(r.reference);
  li.querySelector('[data-k="open"]').onclick = () => { if (r.url) chrome.tabs.create({ url: r.url }); };
  return li;
}

async function copy(text) {
  await navigator.clipboard.writeText(text);
  $("status").textContent = "Disalin. Tempel (Ctrl+V) di Google Docs.";
}

function esc(s) { return String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

init();
