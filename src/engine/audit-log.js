// Extension-only audit journal. The service worker derives the server from sender.url and serializes writes.
export function createAuditLog({ sendMessage, origin, clientVersion, onChange = () => {}, onError = () => {} }) {
  if (typeof sendMessage !== 'function' || typeof origin !== 'string' ||
      typeof clientVersion !== 'string') throw new Error('日志接口或脚本版本不完整');
  let entries = [];
  let queue = Promise.resolve();
  let lastWait = { text: '', at: 0 };
  const notify = () => onChange(entries.slice());
  const enqueue = fn => {
    const result = queue.then(fn);
    queue = result.catch(() => {}); // a failed write must not poison the next explicit attempt
    return result.catch(error => { onError(error); throw error; });
  };
  async function request(type, entry) {
    const response = await sendMessage({ type, clientVersion, ...(entry ? { entry } : {}) });
    if (response?.ok !== true || !Array.isArray(response.entries)) {
      throw new Error(response?.reason || '日志服务未返回有效数据');
    }
    entries = response.entries.slice(-300);
    notify();
    return entries.slice();
  }
  return {
    get entries() { return entries.slice(); },
    load: () => enqueue(() => request('log.read')),
    append(entry) {
      if (entry?.kind === 'wait') {
        const text = String(entry.summary || '');
        if (text === lastWait.text && Date.now() - lastWait.at < 30000) return Promise.resolve(entries.slice());
        lastWait = { text, at: Date.now() };
      }
      return enqueue(() => request('log.append', entry));
    },
    clear: () => enqueue(() => request('log.clear')),
    async exportJSON() {
      // Read from the background again so another tab's latest entries are included.
      const latest = await enqueue(() => request('log.read'));
      const payload = { format: 'spui.audit.v1', server: origin,
        exportedAt: new Date().toISOString(), entries: latest };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `卫戍协议-执行日志-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      link.hidden = true;
      document.body.append(link);
      try { link.click(); } finally {
        link.remove();
        const timer = setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
        timer?.unref?.(); // Node tests should not wait; browsers use a numeric timer ID.
      }
      return latest.length;
    },
  };
}
