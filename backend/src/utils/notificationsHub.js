const clients = new Map();

export function addNotificationClient(userId, res) {
    const existing = clients.get(userId) || new Set();
    existing.add(res);
    clients.set(userId, existing);

    res.on('close', () => {
        const set = clients.get(userId);
        if (!set) return;
        set.delete(res);
        if (set.size === 0) {
            clients.delete(userId);
        }
    });
}

export function sendNotification(userId, payload) {
    const set = clients.get(userId);
    if (!set || set.size === 0) return;

    const data = `data: ${JSON.stringify(payload)}\n\n`;
    for (const res of set) {
        res.write(data);
    }
}
