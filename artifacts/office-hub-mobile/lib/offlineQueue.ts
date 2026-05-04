import AsyncStorage from "@react-native-async-storage/async-storage";

const QUEUE_KEY_PREFIX = "officehub.offline.queue";

export interface QueuedRequest {
  id: string;
  path: string;
  method: string;
  body?: string;
  timestamp: number;
}

let _ownerId: string | null = null;

export function setQueueOwner(userId: string | number | null) {
  _ownerId = userId != null ? String(userId) : null;
}

function queueKey(): string | null {
  if (!_ownerId) return null;
  return `${QUEUE_KEY_PREFIX}.${_ownerId}`;
}

type QueueChangeListener = (count: number) => void;
const queueChangeListeners = new Set<QueueChangeListener>();

export function onQueueChange(listener: QueueChangeListener): () => void {
  queueChangeListeners.add(listener);
  return () => {
    queueChangeListeners.delete(listener);
  };
}

async function notifyListeners() {
  const count = (await getQueue()).length;
  queueChangeListeners.forEach((l) => l(count));
}

export async function getQueue(): Promise<QueuedRequest[]> {
  const key = queueKey();
  if (!key) return [];
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as QueuedRequest[];
  } catch {
    return [];
  }
}

export async function enqueue(
  item: Omit<QueuedRequest, "id" | "timestamp">,
): Promise<QueuedRequest | null> {
  const key = queueKey();
  if (!key) return null;
  const queue = await getQueue();
  const entry: QueuedRequest = {
    ...item,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
  };
  queue.push(entry);
  await AsyncStorage.setItem(key, JSON.stringify(queue));
  await notifyListeners();
  return entry;
}

async function removeFromQueue(id: string): Promise<void> {
  const key = queueKey();
  if (!key) return;
  const queue = await getQueue();
  await AsyncStorage.setItem(
    key,
    JSON.stringify(queue.filter((i) => i.id !== id)),
  );
}

export async function clearQueue(): Promise<void> {
  const key = queueKey();
  if (!key) return;
  await AsyncStorage.removeItem(key);
  await notifyListeners();
}

let _processing = false;

export async function processQueue(
  fetchFn: (path: string, init: RequestInit) => Promise<Response>,
): Promise<{ succeeded: number; failed: number }> {
  if (_processing) return { succeeded: 0, failed: 0 };
  _processing = true;

  let succeeded = 0;
  let failed = 0;

  try {
    const queue = await getQueue();
    for (const item of queue) {
      try {
        const res = await fetchFn(item.path, {
          method: item.method,
          body: item.body,
        });
        if (res.ok) {
          await removeFromQueue(item.id);
          succeeded++;
        } else if (res.status < 500) {
          await removeFromQueue(item.id);
          failed++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }
  } finally {
    _processing = false;
    await notifyListeners();
  }

  return { succeeded, failed };
}
