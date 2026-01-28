import { useEffect, useMemo, useState } from 'react';
import { apiRequest, getAuthTokens } from '../../utils/api';
import './SocialBoard.css';

const STORAGE_KEYS = {
    friends: 'broverse_board_friends'
};

function getCurrentUser() {
    const raw = localStorage.getItem('broverse_user');
    if (raw) {
        try {
            return JSON.parse(raw);
        } catch {
            return null;
        }
    }

    return {
        id: 'guest',
        name: 'Brother',
        tagline: 'Building something real.'
    };
}

function loadFromStorage(key, fallback) {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    try {
        return JSON.parse(raw);
    } catch {
        return fallback;
    }
}

function saveToStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function formatTimestamp(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });
}

const demoPosts = [
    {
        id: 'demo-1',
        authorId: 'demo-user',
        authorName: 'BroVerse Team',
        content: 'Welcome to the Board. Log in to post wins and react to your brothers.',
        visibility: 'public',
        createdAt: new Date().toISOString(),
        likes: [{ id: 'like-1' }],
        comments: [
            {
                id: 'comment-1',
                authorName: 'Coach',
                content: 'Daily check-ins keep the momentum alive.',
                createdAt: new Date().toISOString()
            }
        ],
        shares: 1
    },
    {
        id: 'demo-2',
        authorId: 'demo-user-2',
        authorName: 'Accountability Circle',
        content: 'Try the Challenges panel to join or create a mission.',
        visibility: 'public',
        createdAt: new Date().toISOString(),
        likes: [],
        comments: [],
        shares: 0
    }
];

const demoChallenges = [
    {
        id: 'demo-challenge-1',
        title: 'Hydrate Week',
        description: 'Drink 2L water every day this week.'
    },
    {
        id: 'demo-challenge-2',
        title: '5AM Rise',
        description: 'Wake before 5:30am for five straight days.'
    }
];

export function SocialBoard() {
    const currentUser = useMemo(() => getCurrentUser(), []);
    const [posts, setPosts] = useState([]);
    const [friends, setFriends] = useState(() => loadFromStorage(STORAGE_KEYS.friends, []));
    const [composerText, setComposerText] = useState('');
    const [visibility, setVisibility] = useState('public');
    const [filter, setFilter] = useState('all');
    const [friendName, setFriendName] = useState('');
    const [commentInputs, setCommentInputs] = useState({});
    const [statusMessage, setStatusMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [authNotice, setAuthNotice] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isPosting, setIsPosting] = useState(false);
    const [isCommenting, setIsCommenting] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(() => !!getAuthTokens()?.accessToken);
    const [challenges, setChallenges] = useState([]);
    const [challengeTitle, setChallengeTitle] = useState('');
    const [challengeDescription, setChallengeDescription] = useState('');
    const [challengeType, setChallengeType] = useState('custom');
    const [challengeNoteInputs, setChallengeNoteInputs] = useState({});
    const [isLoadingChallenges, setIsLoadingChallenges] = useState(false);
    const [challengeError, setChallengeError] = useState('');
    const [notifications, setNotifications] = useState([]);
    const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
    const [notificationError, setNotificationError] = useState('');

    useEffect(() => {
        saveToStorage(STORAGE_KEYS.friends, friends);
    }, [friends]);

    useEffect(() => {
        setIsAuthenticated(!!getAuthTokens()?.accessToken);
    }, []);

    useEffect(() => {
        const handleAuthExpired = () => {
            setIsAuthenticated(false);
            setErrorMessage('Session expired. Log in again to see the board.');
            setAuthNotice('Session expired. Please log in again.');
            setChallenges([]);
        };

        window.addEventListener('broverse:auth:expired', handleAuthExpired);
        return () => window.removeEventListener('broverse:auth:expired', handleAuthExpired);
    }, []);

    const fetchPosts = async () => {
        setIsLoading(true);
        setErrorMessage('');
        setAuthNotice('');
        try {
            const data = await apiRequest('/posts');
            const normalized = data.map((post) => ({
                id: post.id,
                authorId: post.authorId,
                authorName: post.author?.displayName || 'Brother',
                content: post.content,
                visibility: post.visibility,
                createdAt: post.createdAt,
                likes: post.reactions || [],
                comments: (post.comments || []).map((comment) => ({
                    id: comment.id,
                    authorName: comment.author?.displayName || 'Brother',
                    content: comment.content,
                    createdAt: comment.createdAt
                })),
                shares: post.shares || 0
            }));
            setPosts(normalized);
        } catch (err) {
            if (err?.status === 401) {
                setIsAuthenticated(false);
                setErrorMessage('Session expired. Log in again to load posts.');
                setAuthNotice('Session expired. Please log in again.');
            } else {
                setErrorMessage('Unable to load posts right now.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            fetchPosts();
            fetchChallenges();
            fetchNotifications();
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (!isAuthenticated) return;
        const interval = setInterval(() => {
            fetchNotifications();
        }, 30000);

        return () => clearInterval(interval);
    }, [isAuthenticated]);

    const fetchChallenges = async () => {
        setIsLoadingChallenges(true);
        setChallengeError('');
        try {
            const data = await apiRequest('/challenges');
            setChallenges(data);
        } catch (err) {
            setChallenges([]);
            if (err?.status === 401) {
                setIsAuthenticated(false);
                setChallengeError('Session expired. Log in again to view challenges.');
                setAuthNotice('Session expired. Please log in again.');
            } else {
                setChallengeError('Unable to load challenges right now.');
            }
        } finally {
            setIsLoadingChallenges(false);
        }
    };

    const fetchNotifications = async () => {
        setIsLoadingNotifications(true);
        setNotificationError('');
        try {
            const data = await apiRequest('/notifications');
            setNotifications(data);
        } catch (err) {
            if (err?.status === 401) {
                setIsAuthenticated(false);
                setNotificationError('Session expired. Log in again to view notifications.');
                setAuthNotice('Session expired. Please log in again.');
            } else {
                setNotificationError('Unable to load notifications.');
            }
        } finally {
            setIsLoadingNotifications(false);
        }
    };

    const handleMarkNotificationRead = async (notificationId) => {
        try {
            await apiRequest(`/notifications/${notificationId}/read`, {
                method: 'POST'
            });
            setNotifications((prev) => prev.filter((note) => note.id !== notificationId));
        } catch {
            setStatusMessage('Unable to update notification.');
            setTimeout(() => setStatusMessage(''), 2000);
        }
    };

    const filteredPosts = useMemo(() => {
        return posts.filter((post) => {
            if (filter === 'all') return true;
            if (filter === 'public') return post.visibility === 'public';
            if (filter === 'private') return post.visibility === 'private' && post.authorId === currentUser.id;
            if (filter === 'friends') return post.visibility === 'friends';
            return true;
        });
    }, [posts, filter, currentUser.id]);

    const displayPosts = isAuthenticated ? filteredPosts : demoPosts;
    const displayChallenges = isAuthenticated ? challenges : demoChallenges;

    const handleCreatePost = async () => {
        if (!composerText.trim()) return;
        setIsPosting(true);
        try {
            await apiRequest('/posts', {
                method: 'POST',
                body: {
                    content: composerText.trim(),
                    visibility
                }
            });
            setComposerText('');
            setStatusMessage('Post shared.');
            fetchPosts();
        } catch (err) {
            if (err?.status === 401) {
                setStatusMessage('Session expired. Log in again to post.');
                setIsAuthenticated(false);
            } else {
                setStatusMessage('Unable to post yet.');
            }
        } finally {
            setIsPosting(false);
        }
        setTimeout(() => setStatusMessage(''), 2000);
    };

    const toggleLike = async (postId) => {
        try {
            await apiRequest(`/posts/${postId}/reactions`, {
                method: 'POST',
                body: { type: 'like' }
            });
            fetchPosts();
        } catch {
            setStatusMessage('Unable to react right now.');
            setTimeout(() => setStatusMessage(''), 2000);
        }
    };

    const handleShare = async (postId) => {
        const shareUrl = `${window.location.origin}/board#${postId}`;
        try {
            await navigator.clipboard.writeText(shareUrl);
            setStatusMessage('Share link copied.');
        } catch {
            setStatusMessage('Share link ready.');
        }

        setPosts((prev) =>
            prev.map((post) => (post.id === postId ? { ...post, shares: post.shares + 1 } : post))
        );

        setTimeout(() => setStatusMessage(''), 2000);
    };

    const handleCommentChange = (postId, value) => {
        setCommentInputs((prev) => ({ ...prev, [postId]: value }));
    };

    const handleAddComment = async (postId) => {
        const content = (commentInputs[postId] || '').trim();
        if (!content) return;
        setIsCommenting(true);
        try {
            await apiRequest(`/posts/${postId}/comments`, {
                method: 'POST',
                body: { content }
            });
            setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
            fetchPosts();
        } catch (err) {
            if (err?.status === 401) {
                setStatusMessage('Session expired. Log in again to comment.');
                setIsAuthenticated(false);
            } else {
                setStatusMessage('Unable to comment right now.');
            }
            setTimeout(() => setStatusMessage(''), 2000);
        } finally {
            setIsCommenting(false);
        }
    };

    const handleAddFriend = () => {
        if (!friendName.trim()) return;
        const newFriend = {
            id: `friend-${Date.now()}`,
            name: friendName.trim(),
            createdAt: new Date().toISOString()
        };
        setFriends((prev) => [newFriend, ...prev]);
        setFriendName('');
    };

    const handleCreateChallenge = async () => {
        if (!challengeTitle.trim() || !challengeDescription.trim()) return;
        try {
            await apiRequest('/challenges', {
                method: 'POST',
                body: {
                    title: challengeTitle.trim(),
                    description: challengeDescription.trim(),
                    challengeType
                }
            });
            setChallengeTitle('');
            setChallengeDescription('');
            setStatusMessage('Challenge created.');
            fetchChallenges();
        } catch (err) {
            if (err?.status === 401) {
                setStatusMessage('Session expired. Log in again to create challenges.');
                setIsAuthenticated(false);
            } else {
                setStatusMessage('Unable to create challenge.');
            }
        }
        setTimeout(() => setStatusMessage(''), 2000);
    };

    const handleJoinChallenge = async (challengeId) => {
        try {
            await apiRequest(`/challenges/${challengeId}/join`, {
                method: 'POST'
            });
            setStatusMessage('Challenge joined.');
            fetchChallenges();
        } catch (err) {
            if (err?.status === 401) {
                setStatusMessage('Session expired. Log in again to join.');
                setIsAuthenticated(false);
            } else {
                setStatusMessage('Unable to join challenge.');
            }
        }
        setTimeout(() => setStatusMessage(''), 2000);
    };

    const handleChallengeNoteChange = (challengeId, value) => {
        setChallengeNoteInputs((prev) => ({ ...prev, [challengeId]: value }));
    };

    const handleCheckIn = async (challengeId) => {
        const notes = (challengeNoteInputs[challengeId] || '').trim();
        try {
            await apiRequest(`/challenges/${challengeId}/checkins`, {
                method: 'POST',
                body: { notes }
            });
            setChallengeNoteInputs((prev) => ({ ...prev, [challengeId]: '' }));
            setStatusMessage('Check-in logged.');
        } catch (err) {
            if (err?.status === 401) {
                setStatusMessage('Session expired. Log in again to check in.');
                setIsAuthenticated(false);
            } else {
                setStatusMessage('Unable to check in. Join first.');
            }
        }
        setTimeout(() => setStatusMessage(''), 2000);
    };

    return (
        <div className="social-board">
            <header className="board-header">
                <div>
                    <h1>The BroVerse Board</h1>
                    <p>Post wins, share challenges, and keep your circle tight.</p>
                </div>
                <div className="board-status">{statusMessage}</div>
            </header>

            {(authNotice || !isAuthenticated) && (
                <div className="board-banner">
                    {authNotice || 'You are viewing a demo feed. Log in to post, comment, and join challenges.'}
                </div>
            )}

            <section className="board-composer">
                <div className="composer-header">
                    <span className="composer-user">{currentUser.name}</span>
                    <select value={visibility} onChange={(event) => setVisibility(event.target.value)}>
                        <option value="public">Public</option>
                        <option value="friends">Friends</option>
                        <option value="private">Private</option>
                    </select>
                </div>
                <textarea
                    value={composerText}
                    onChange={(event) => setComposerText(event.target.value)}
                    placeholder="Drop a win, a challenge, or a call for accountability."
                    rows={3}
                />
                <div className="composer-actions">
                    <button onClick={handleCreatePost} disabled={!isAuthenticated || isLoading || isPosting}>
                        {isAuthenticated ? (isPosting ? 'Posting...' : 'Post') : 'Log in to post'}
                    </button>
                </div>
                {!isAuthenticated && (
                    <p className="board-auth-warning">
                        Log in from the Profile page to post and react.
                    </p>
                )}
            </section>

            <div className="board-layout">
                <section className="board-feed">
                    <div className="board-filters">
                        {['all', 'public', 'friends', 'private'].map((tab) => (
                            <button
                                key={tab}
                                className={filter === tab ? 'active' : ''}
                                onClick={() => setFilter(tab)}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>

                    {isLoading && (
                        <div className="board-empty">Loading posts...</div>
                    )}

                    {errorMessage && (
                        <div className="board-empty">
                            {errorMessage}
                            {isAuthenticated && (
                                <button className="board-retry" onClick={fetchPosts}>
                                    Retry
                                </button>
                            )}
                        </div>
                    )}

                    {!isLoading && !errorMessage && displayPosts.length === 0 && (
                        <div className="board-empty">
                            No posts yet. Be the first to share a win.
                        </div>
                    )}

                    {displayPosts.map((post) => (
                        <article key={post.id} id={post.id} className="board-post">
                            <div className="post-header">
                                <div>
                                    <div className="post-author">{post.authorName}</div>
                                    <div className="post-meta">
                                        {formatTimestamp(post.createdAt)} • {post.visibility}
                                    </div>
                                </div>
                                <span className="post-tag">Bro Verse</span>
                            </div>
                            <p className="post-content">{post.content}</p>

                            <div className="post-actions">
                                <button onClick={() => toggleLike(post.id)} disabled={!isAuthenticated}>
                                    ❤️ {post.likes.length}
                                </button>
                                <button onClick={() => handleShare(post.id)} disabled={!isAuthenticated}>
                                    🔁 {post.shares}
                                </button>
                                <span>{post.comments.length} comments</span>
                            </div>

                            <div className="post-comments">
                                {post.comments.map((comment) => (
                                    <div key={comment.id} className="comment-row">
                                        <div className="comment-author">{comment.authorName}</div>
                                        <div className="comment-body">{comment.content}</div>
                                        <div className="comment-meta">{formatTimestamp(comment.createdAt)}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="comment-input">
                                <input
                                    value={commentInputs[post.id] || ''}
                                    onChange={(event) => handleCommentChange(post.id, event.target.value)}
                                    placeholder="Add a comment..."
                                    disabled={!isAuthenticated || isCommenting}
                                />
                                <button
                                    onClick={() => handleAddComment(post.id)}
                                    disabled={!isAuthenticated || isCommenting}
                                >
                                    {isCommenting ? 'Sending...' : 'Send'}
                                </button>
                            </div>
                        </article>
                    ))}
                </section>

                <aside className="board-sidebar">
                    <div className="sidebar-card">
                        <h3>Notifications</h3>
                        {!isAuthenticated && (
                            <p className="challenge-loading">Log in to see updates.</p>
                        )}
                        {isAuthenticated && isLoadingNotifications && (
                            <p className="challenge-loading">Loading notifications...</p>
                        )}
                        {isAuthenticated && notificationError && (
                            <p className="challenge-loading">
                                {notificationError}
                                <button className="board-retry" onClick={fetchNotifications}>
                                    Retry
                                </button>
                            </p>
                        )}
                        {isAuthenticated && !isLoadingNotifications && !notificationError && notifications.length === 0 && (
                            <p className="challenge-loading">No new alerts yet.</p>
                        )}
                        <ul className="notification-list">
                            {isAuthenticated && notifications.map((note) => (
                                <li key={note.id} className="notification-item">
                                    <div>
                                        <strong>{note.actor?.displayName || 'Brother'}</strong>
                                        <span>{note.message || 'sent an update.'}</span>
                                        <div className="notification-meta">{formatTimestamp(note.createdAt)}</div>
                                    </div>
                                    <button onClick={() => handleMarkNotificationRead(note.id)}>
                                        Mark read
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="sidebar-card">
                        <h3>Your Circle</h3>
                        <p>Add brothers to keep challenges accountable.</p>
                        <div className="friend-input">
                            <input
                                value={friendName}
                                onChange={(event) => setFriendName(event.target.value)}
                                placeholder="Add friend name"
                            />
                            <button onClick={handleAddFriend}>Add</button>
                        </div>
                        <ul className="friend-list">
                            {friends.map((friend) => (
                                <li key={friend.id}>{friend.name}</li>
                            ))}
                            {friends.length === 0 && (
                                <li className="friend-empty">No brothers yet.</li>
                            )}
                        </ul>
                    </div>

                    <div className="sidebar-card">
                        <h3>Challenge Ladder</h3>
                        <p>Stack wins to level up.</p>
                        <div className="challenge-create">
                            <input
                                value={challengeTitle}
                                onChange={(event) => setChallengeTitle(event.target.value)}
                                placeholder="Challenge title"
                                disabled={!isAuthenticated}
                            />
                            <textarea
                                value={challengeDescription}
                                onChange={(event) => setChallengeDescription(event.target.value)}
                                placeholder="What is the mission?"
                                rows={2}
                                disabled={!isAuthenticated}
                            />
                            <select
                                value={challengeType}
                                onChange={(event) => setChallengeType(event.target.value)}
                                disabled={!isAuthenticated}
                            >
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="30_day">30-Day</option>
                                <option value="custom">Custom</option>
                            </select>
                            <button onClick={handleCreateChallenge} disabled={!isAuthenticated || isLoadingChallenges}>
                                {isLoadingChallenges ? 'Working...' : 'Create Challenge'}
                            </button>
                        </div>

                        {isLoadingChallenges && <p className="challenge-loading">Loading challenges...</p>}

                        {challengeError && !isLoadingChallenges && (
                            <p className="challenge-loading">
                                {challengeError}
                                {isAuthenticated && (
                                    <button className="board-retry" onClick={fetchChallenges}>
                                        Retry
                                    </button>
                                )}
                            </p>
                        )}

                        {!isLoadingChallenges && !challengeError && displayChallenges.length === 0 && (
                            <p className="challenge-loading">No active challenges yet.</p>
                        )}

                        <div className="challenge-list">
                            {displayChallenges.map((challenge) => (
                                <div key={challenge.id} className="challenge-item">
                                    <div>
                                        <strong>{challenge.title}</strong>
                                        <span>{challenge.description}</span>
                                    </div>
                                    <button onClick={() => handleJoinChallenge(challenge.id)} disabled={!isAuthenticated}>
                                        Join
                                    </button>
                                    <div className="challenge-checkin">
                                        <input
                                            value={challengeNoteInputs[challenge.id] || ''}
                                            onChange={(event) => handleChallengeNoteChange(challenge.id, event.target.value)}
                                            placeholder="Check-in note"
                                            disabled={!isAuthenticated}
                                        />
                                        <button onClick={() => handleCheckIn(challenge.id)} disabled={!isAuthenticated}>
                                            Check in
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}

export default SocialBoard;
