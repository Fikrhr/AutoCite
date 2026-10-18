chrome.storage.local.get(["geminiKey", "s2Key"]).then(({ geminiKey, s2Key }) => {
  document.getElementById("key").value = geminiKey || "";
  document.getElementById("s2").value = s2Key || "";
});
document.getElementById("save").onclick = async () => {
  await chrome.storage.local.set({
    geminiKey: document.getElementById("key").value.trim(),
    s2Key: document.getElementById("s2").value.trim(),
  });
  document.getElementById("msg").textContent = "Tersimpan.";
};
