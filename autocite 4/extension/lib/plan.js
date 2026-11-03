// Status paket. Pembayaran belum tersedia (UC-10), jadi selama pengembangan SEMUA fitur Premium dibuka.
// Setelah pembayaran siap, ubah DEV_UNLOCK_ALL menjadi false; status "premium" lalu dibaca dari storage.
export const DEV_UNLOCK_ALL = true;

export async function isPremium() {
  if (DEV_UNLOCK_ALL) return true;
  const { plan } = await chrome.storage.local.get("plan");
  return plan === "premium";
}
