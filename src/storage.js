// Real persistence for QAMAR, backed by the browser's localStorage.
// Every function here is async to match how the rest of the app calls it,
// even though localStorage itself is synchronous under the hood.

export async function storageGet(key) {
  const v = localStorage.getItem(key);
  return v !== null ? { key, value: v } : null;
}

export async function storageSet(key, value) {
  localStorage.setItem(key, value);
  return { key, value };
}

export async function storageDelete(key) {
  localStorage.removeItem(key);
  return { key, deleted: true };
}

export async function storageList(prefix = "") {
  const keys = Object.keys(localStorage).filter((k) => k.startsWith(prefix));
  return { keys };
}
