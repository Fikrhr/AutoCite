// Menyisipkan sitasi ke Google Docs lewat Google Docs API (UC-05).
const API = "https://docs.googleapis.com/v1/documents";

// Kumpulkan semua teks dokumen beserta indeks aslinya (termasuk di dalam tabel).
function collect(elements, chars, idxs) {
  for (const el of elements || []) {
    if (el.paragraph) {
      for (const pe of el.paragraph.elements || []) {
        const t = pe.textRun?.content;
        if (!t) continue;
        for (let i = 0; i < t.length; i++) { chars.push(t[i]); idxs.push(pe.startIndex + i); }
      }
    } else if (el.table) {
      for (const row of el.table.tableRows || [])
        for (const cell of row.tableCells || []) collect(cell.content, chars, idxs);
    }
  }
}

// Cari teks yang dipilih di dokumen (abaikan beda spasi/baris baru) dan kembalikan indeks sisip:
// tepat sebelum tanda baca penutup (.!?) bila ada, jika tidak tepat setelah teks.
export function findInsertIndex(doc, needle) {
  const chars = [], idxs = [];
  collect(doc.body?.content, chars, idxs);
  const keepC = [], keepI = [];
  chars.forEach((c, k) => { if (!/\s/.test(c)) { keepC.push(c); keepI.push(idxs[k]); } });
  const hay = keepC.join("");
  const nd = needle.replace(/\s+/g, "");
  if (!nd) return null;
  const pos = hay.indexOf(nd);
  if (pos < 0) return null;
  const endChar = nd[nd.length - 1];
  const lastIdx = keepI[pos + nd.length - 1];
  return /[.!?]/.test(endChar) ? lastIdx : lastIdx + 1;
}

// Bedakan penyebab 401/403: API belum aktif, izin (scope) kurang, atau akun tidak punya akses ke dokumen.
async function apiError(res) {
  let msg = "", status = "";
  try { const j = await res.json(); msg = j.error?.message || ""; status = j.error?.status || ""; } catch (_) {}
  if (/has not been used|is disabled|SERVICE_DISABLED/i.test(msg + status)) return new Error("API_DISABLED");
  if (res.status === 401 || /insufficient|scope/i.test(msg)) return new Error("SCOPE");
  if (res.status === 403 || res.status === 404) return new Error("NO_ACCESS: " + msg);
  return new Error(`Docs API ${res.status}: ${msg}`);
}

export async function insertCitation(token, docId, needle, insertion) {
  const auth = { Authorization: `Bearer ${token}` };
  const r = await fetch(`${API}/${docId}`, { headers: auth });
  if (!r.ok) throw await apiError(r);
  const doc = await r.json();
  const index = findInsertIndex(doc, needle);
  if (index == null) throw new Error("NOT_FOUND");
  const res = await fetch(`${API}/${docId}:batchUpdate`, {
    method: "POST",
    headers: { ...auth, "Content-Type": "application/json" },
    body: JSON.stringify({ requests: [{ insertText: { location: { index }, text: " " + insertion } }] }),
  });
  if (!res.ok) throw await apiError(res);
  return true;
}
