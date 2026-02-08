import { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';
import './BadgeDisplay.css';

export function BadgeDisplay({ userId }) {
    const [badges, setBadges] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadBadges();
    }, [userId]);

    const loadBadges = async () => {
        try {
            const data = await apiRequest('/badges/mine');
            setBadges(data);
        } catch {
            /* ignore */
        } finally {
            setLoading(false);
        }
    };

    if (loading) return null;
    if (badges.length === 0) return null;

    // Group by category
    const grouped = badges.reduce((acc, b) => {
        const cat = b.badge?.category || 'other';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(b);
        return acc;
    }, {});

    return (
        <div className="badge-display">
            <h4>Badges</h4>
            <div className="badge-grid">
                {badges.map(ub => (
                    <div key={ub.id} className="badge-item" title={ub.badge.description}>
                        <div className="badge-icon-wrap">
                            <span className="badge-emoji">🏅</span>
                        </div>
                        <span className="badge-name">{ub.badge.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default BadgeDisplay;
