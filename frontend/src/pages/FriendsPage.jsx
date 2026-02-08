import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiRequest } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import './FriendsPage.css';

export function FriendsPage() {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [friends, setFriends] = useState([]);
    const [pending, setPending] = useState({ incoming: [], outgoing: [] });
    const [suggestions, setSuggestions] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [tab, setTab] = useState('friends');

    useEffect(() => {
        if (!isAuthenticated) { navigate('/profile'); return; }
        loadData();
    }, [isAuthenticated]);

    const loadData = async () => {
        try {
            const [f, p, s] = await Promise.all([
                apiRequest('/relationships/friends'),
                apiRequest('/relationships/pending'),
                apiRequest('/users/suggestions')
            ]);
            setFriends(f);
            setPending(p);
            setSuggestions(s);
        } catch { /* ignore */ }
    };

    const handleSearch = async () => {
        if (searchQuery.trim().length < 2) return;
        try {
            const results = await apiRequest(`/users/search?q=${encodeURIComponent(searchQuery.trim())}`);
            setSearchResults(results);
        } catch { /* ignore */ }
    };

    const sendRequest = async (userId) => {
        try {
            await apiRequest('/relationships/request', { method: 'POST', body: { addresseeId: userId } });
            loadData();
        } catch { /* ignore */ }
    };

    const acceptRequest = async (id) => {
        try {
            await apiRequest(`/relationships/${id}/accept`, { method: 'POST' });
            loadData();
        } catch { /* ignore */ }
    };

    const rejectRequest = async (id) => {
        try {
            await apiRequest(`/relationships/${id}/reject`, { method: 'POST' });
            loadData();
        } catch { /* ignore */ }
    };

    const removeFriend = async (id) => {
        try {
            await apiRequest(`/relationships/${id}`, { method: 'DELETE' });
            loadData();
        } catch { /* ignore */ }
    };

    if (!isAuthenticated) return null;

    return (
        <div className="friends-page">
            <div className="friends-tabs">
                <button className={tab === 'friends' ? 'active' : ''} onClick={() => setTab('friends')}>
                    Friends ({friends.length})
                </button>
                <button className={tab === 'pending' ? 'active' : ''} onClick={() => setTab('pending')}>
                    Pending ({pending.incoming.length})
                </button>
                <button className={tab === 'discover' ? 'active' : ''} onClick={() => setTab('discover')}>
                    Discover
                </button>
            </div>

            {tab === 'friends' && (
                <div className="friends-list">
                    {friends.map(f => (
                        <div key={f.id} className="friend-card">
                            <div className="friend-info">
                                <span className="friend-name">{f.displayName}</span>
                                {f.tagline && <span className="friend-tagline">{f.tagline}</span>}
                            </div>
                            <div className="friend-actions">
                                <button onClick={() => { navigate('/messages'); }}>Message</button>
                                <button className="remove-btn" onClick={() => removeFriend(f.relationshipId)}>Remove</button>
                            </div>
                        </div>
                    ))}
                    {friends.length === 0 && <p className="empty-state">No friends yet. Discover people to connect with!</p>}
                </div>
            )}

            {tab === 'pending' && (
                <div className="pending-list">
                    <h3>Incoming Requests</h3>
                    {pending.incoming.map(r => (
                        <div key={r.id} className="friend-card">
                            <span className="friend-name">{r.requester.displayName}</span>
                            <div className="friend-actions">
                                <button className="accept-btn" onClick={() => acceptRequest(r.id)}>Accept</button>
                                <button className="remove-btn" onClick={() => rejectRequest(r.id)}>Decline</button>
                            </div>
                        </div>
                    ))}
                    {pending.incoming.length === 0 && <p className="empty-state">No pending requests</p>}

                    <h3>Sent Requests</h3>
                    {pending.outgoing.map(r => (
                        <div key={r.id} className="friend-card">
                            <span className="friend-name">{r.addressee.displayName}</span>
                            <span className="pending-label">Pending</span>
                        </div>
                    ))}
                </div>
            )}

            {tab === 'discover' && (
                <div className="discover-section">
                    <div className="search-bar">
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Search by name..."
                        />
                        <button onClick={handleSearch}>Search</button>
                    </div>

                    {searchResults.length > 0 && (
                        <>
                            <h3>Search Results</h3>
                            {searchResults.map(u => (
                                <div key={u.id} className="friend-card">
                                    <div className="friend-info">
                                        <span className="friend-name">{u.displayName}</span>
                                        {u.tagline && <span className="friend-tagline">{u.tagline}</span>}
                                    </div>
                                    <button onClick={() => sendRequest(u.id)}>Add Friend</button>
                                </div>
                            ))}
                        </>
                    )}

                    <h3>Suggested</h3>
                    {suggestions.map(u => (
                        <div key={u.id} className="friend-card">
                            <div className="friend-info">
                                <span className="friend-name">{u.displayName}</span>
                                {u.tagline && <span className="friend-tagline">{u.tagline}</span>}
                            </div>
                            <button onClick={() => sendRequest(u.id)}>Add Friend</button>
                        </div>
                    ))}
                    {suggestions.length === 0 && <p className="empty-state">No suggestions right now</p>}
                </div>
            )}
        </div>
    );
}

export default FriendsPage;
