import jwt from 'jsonwebtoken';

export function verifyAccessToken(token) {
    if (!token) return null;
    try {
        return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    } catch {
        return null;
    }
}

export function requireAuth(req, res, next) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
        return res.status(401).json({ error: 'Missing token' });
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
        return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = payload;
    return next();
}
