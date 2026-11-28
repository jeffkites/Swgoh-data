// FNV-1a over the UTF-8 source ID, modulo a power of two.
export function recordPath(dataset, id) {
  let hash = 2166136261;
  for (const byte of new TextEncoder().encode(String(id))) {
    hash = Math.imul(hash ^ byte, 16777619);
  }
  const bucket = ((hash >>> 0) % dataset.buckets).toString(16).padStart(2, '0');
  return dataset.path.replace('{bucket}', bucket);
}
