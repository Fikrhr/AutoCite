// Mengambil teks terpilih di Google Docs.
// Catatan: Docs merender teks di canvas, jadi window.getSelection() tidak selalu berisi teks.
// Jika kosong, popup meminta pengguna menempelkan teks (lihat popup.js).
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "GET_SELECTION") {
    let text = "";
    try {
      text = String(window.getSelection() || "").trim();
      if (!text) {
        const frame = document.querySelector(".docs-texteventtarget-iframe");
        text = String(frame?.contentWindow?.getSelection?.() || "").trim();
      }
    } catch (_) {}
    sendResponse({ text });
  }
});
