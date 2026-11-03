const $ = (id) => document.getElementById(id);
chrome.storage.local.get(["geminiKey", "s2Key", "oaKey", "prefs"]).then(({ geminiKey, s2Key, oaKey, prefs }) => {
  $("key").value = geminiKey || "";
  $("s2").value = s2Key || "";
  $("oa").value = oaKey || "";
  $("format").value = prefs?.format || "apa";
  $("count").value = String(prefs?.count || 5);
});
$("save").onclick = async () => {
  await chrome.storage.local.set({
    geminiKey: $("key").value.trim(),
    s2Key: $("s2").value.trim(),
    oaKey: $("oa").value.trim(),
    prefs: { format: $("format").value, count: Number($("count").value) },
  });
  $("msg").textContent = "Tersimpan.";
};
