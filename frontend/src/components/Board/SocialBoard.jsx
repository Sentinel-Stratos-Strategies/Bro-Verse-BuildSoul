import { useEffect, useMemo, useState } from 'react';
import './SocialBoard.css';

const STORAGE_KEYS = {
    posts: 'broverse_board_posts',
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

export function SocialBoard() {
    const currentUser = useMemo(() => getCurrentUser(), []);
    const [posts, setPosts] = useState(() => loadFromStorage(STORAGE_KEYS.posts, []));
    const [friends, setFriends] = useState(() => loadFromStorage(STORAGE_KEYS.friends, []));
    const [composerText, setComposerText] = useState('');
    const [visibility, setVisibility] = useState('public');
    const [filter, setFilter] = useState('all');
    const [friendName, setFriendName] = useState('');
    const [commentInputs, setCommentInputs] = useState({});
    const [statusMessage, setStatusMessage] = useState('');

    useEffect(() => {
        saveToStorage(STORAGE_KEYS.posts, posts);
    }, [posts]);

    useEffect(() => {
        saveToStorage(STORAGE_KEYS.friends, friends);
    }, [friends]);

    const filteredPosts = useMemo(() => {
        return posts.filter((post) => {
            if (filter === 'all') return true;
            if (filter === 'public') return post.visibility === 'public';
            if (filter === 'private') return post.visibility === 'private' && post.authorId === currentUser.id;
            if (filter === 'friends') return post.visibility === 'friends';
            return true;
        });
    }, [posts, filter, currentUser.id]);

    const handleCreatePost = () => {
        if (!composerText.trim()) return;

        const newPost = {
            id: `post-${Date.now()}`,
            authorId: currentUser.id,
            authorName: currentUser.name,
            content: composerText.trim(),
            visibility,
            createdAt: new Date().toISOString(),
            likes: [],
            comments: [],
            shares: 0
        };

        setPosts((prev) => [newPost, ...prev]);
        setComposerText('');
        setStatusMessage('Post shared.');
        setTimeout(() => setStatusMessage(''), 2000);
    };

    const toggleLike = (postId) => {
        setPosts((prev) =>
            prev.map((post) => {
                if (post.id !== postId) return post;
                const hasLiked = post.likes.includes(currentUser.id);
                return {
                    ...post,
                    likes: hasLiked
                        ? post.likes.filter((id) => id !== currentUser.id)
                        : [...post.likes, currentUser.id]
                };
            })
        );
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

    const handleAddComment = (postId) => {
        const content = (commentInputs[postId] || '').trim();
        if (!content) return;

        setPosts((prev) =>
            prev.map((post) => {
                if (post.id !== postId) return post;
                const newComment = {
                    id: `comment-${Date.now()}`,
                    authorName: currentUser.name,
                    content,
                    createdAt: new Date().toISOString()
                };
                return {
                    ...post,
                    comments: [...post.comments, newComment]
                };
            })
        );

        setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
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

    return (
        <div className="social-board">
            <header className="board-header">
                <div>
                    <h1>The BroVerse Board</h1>
                    <p>Post wins, share challenges, and keep your circle tight.</p>
                </div>
                <div className="board-status">{statusMessage}</div>
            </header>

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
                    <button onClick={handleCreatePost}>Post</button>
                </div>
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

                    {filteredPosts.length === 0 && (
                        <div className="board-empty">
                            No posts yet. Be the first to share a win.
                        </div>
                    )}

                    {filteredPosts.map((post) => (
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
                                <button onClick={() => toggleLike(post.id)}>
                                    ❤️ {post.likes.length}
                                </button>
                                <button onClick={() => handleShare(post.id)}>🔁 {post.shares}</button>
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
                                />
                                <button onClick={() => handleAddComment(post.id)}>Send</button>
                            </div>
                        </article>
                    ))}
                </section>

                <aside className="board-sidebar">
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
                        </ul>
                    </div>

                    <div className="sidebar-card">
                        <h3>Challenge Ladder</h3>
                        <p>Stack wins to level up. (Next phase)</p>
                        <div className="challenge-preview">
                            <div>
                                <strong>Level 1</strong>
                                <span>3 wins logged</span>
                            </div>
                            <div>
                                <strong>Level 2</strong>
                                <span>Invite 1 brother</span>
                            </div>
                            <div>
                                <strong>Level 3</strong>
                                <span>Complete 1 challenge</span>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}

export default SocialBoard;
