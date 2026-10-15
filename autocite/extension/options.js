chrome.storage.local.get("geminiKey").then(({ geminiKey }) => { document.getElementById("key").value = geminiKey || ""; });
document.getElementById("save").onclick = async () => {
  await chrome.storage.local.set({ geminiKey: document.getElementById("key").value.trim() });
  document.getElementById("msg").textContent = "Tersimpan.";
};
