// Kuota harian akun Free.
export const FREE_DAILY_LIMIT = 10;

const today = () => new Date().toISOString().slice(0, 10);

export async function getQuota() {
  const { quota } = await chrome.storage.local.get("quota");
  if (!quota || quota.date !== today()) return { date: today(), used: 0 };
  return quota;
}

export async function canSearch() {
  const q = await getQuota();
  return q.used < FREE_DAILY_LIMIT;
}

export async function consume() {
  const q = await getQuota();
  q.used += 1;
  await chrome.storage.local.set({ quota: q });
  return FREE_DAILY_LIMIT - q.used;
}
