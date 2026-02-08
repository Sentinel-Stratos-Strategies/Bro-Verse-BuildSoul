import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRoster } from '../../hooks/useRoster';
import { apiRequest } from '../../utils/api';
import './CharacterSelection.css';

/**
 * CharacterSelection Component
 * Users select up to 4 personas for their 30-day roster lock
 *
 * Uses real API when authenticated, falls back to localStorage for demo
 */
export function CharacterSelection({ characters, onSelectionComplete }) {
    const { isAuthenticated } = useAuth();
    const { activeRoster, daysRemaining, isLocked, loading: rosterLoading, lockRoster: lockRosterAPI, getAvailable } = useRoster();

    const [selectedSlugs, setSelectedSlugs] = useState([]);
    const [availablePersonas, setAvailablePersonas] = useState([]);
    const [locking, setLocking] = useState(false);
    const [alphaBro, setAlphaBro] = useState(null);
    const [showAlphaBuilder, setShowAlphaBuilder] = useState(false);

    const MAX_PREBUILT = 4;

    useEffect(() => {
        if (isAuthenticated) {
            loadAvailablePersonas();
        }
    }, [isAuthenticated]);

    // Populate selections from active roster
    useEffect(() => {
        if (activeRoster?.personaSlugs) {
            setSelectedSlugs(activeRoster.personaSlugs);
        }
    }, [activeRoster]);

    const loadAvailablePersonas = async () => {
        try {
            const personas = await getAvailable();
            setAvailablePersonas(personas || []);
        } catch { /* ignore */ }
    };

    // Use API personas if available, otherwise fall back to prop characters
    const displayCharacters = availablePersonas.length > 0
        ? availablePersonas.map(p => ({
            id: p.slug,
            slug: p.slug,
            name: p.name,
            archetype: p.slug.replace(/-/g, ' '),
            tagline: `The ${p.name}`,
            coreTraits: [],
            isCustom: false
        }))
        : (characters || []).filter(c => !c.isCustom);

    const alphaTemplate = (characters || []).find(c => c.isCustom);

    const toggleCharacter = (character) => {
        if (isLocked) return;
        const slug = character.slug || character.id;

        setSelectedSlugs(prev => {
            if (prev.includes(slug)) return prev.filter(s => s !== slug);
            if (prev.length >= MAX_PREBUILT) return prev;
            return [...prev, slug];
        });
    };

    const handleAlphaBroSave = (customAlpha) => {
        setAlphaBro(customAlpha);
        setShowAlphaBuilder(false);
    };

    const handleLockRoster = async () => {
        if (selectedSlugs.length === 0) return;

        if (isAuthenticated) {
            setLocking(true);
            try {
                await lockRosterAPI(selectedSlugs);
                onSelectionComplete?.({ personaSlugs: selectedSlugs });
            } catch (err) {
                console.error('Lock failed:', err);
                alert('Failed to lock roster. Try again.');
            } finally {
                setLocking(false);
            }
        } else {
            // Fallback: localStorage for demo/unauthenticated users
            const expiry = new Date();
            expiry.setDate(expiry.getDate() + 30);
            const roster = {
                prebuilt: selectedSlugs.map(slug => {
                    const char = displayCharacters.find(c => (c.slug || c.id) === slug);
                    return char || { id: slug, name: slug, slug };
                }),
                alphaBro
            };
            localStorage.setItem('broverse_roster', JSON.stringify(roster));
            localStorage.setItem('broverse_roster_expiry', expiry.toISOString());
            onSelectionComplete?.(roster);
        }
    };

    return (
        <div className="character-selection">
            <div className="selection-header">
                <h2>Build Your Roster</h2>
                <p className="selection-subtitle">
                    Choose up to 4 archetypes for your 30-day roster lock.
                </p>
                {isLocked && (
                    <div className="lock-status">
                        🔒 Roster locked • {daysRemaining} days remaining
                    </div>
                )}
            </div>

            <div className="selection-grid">
                {displayCharacters.map(character => {
                    const slug = character.slug || character.id;
                    const isSelected = selectedSlugs.includes(slug);
                    return (
                        <div
                            key={slug}
                            className={`character-card ${isSelected ? 'selected' : ''} ${isLocked ? 'locked' : ''}`}
                            onClick={() => toggleCharacter(character)}
                        >
                            <div className="character-card-header">
                                <span className="character-archetype">{character.archetype}</span>
                                {isSelected && <span className="check-mark">✓</span>}
                            </div>
                            <h3 className="character-name">{character.name}</h3>
                            <p className="character-tagline">{character.tagline}</p>
                            {character.coreTraits?.length > 0 && (
                                <div className="character-traits">
                                    {character.coreTraits.slice(0, 3).map((trait, i) => (
                                        <span key={i} className="trait-badge">{trait}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Alpha Bro section (only for non-API mode) */}
            {!isAuthenticated && (
                <div className="alpha-section">
                    <h3>Your Alpha Bro</h3>
                    <p>Create your custom legacy character - the voice that speaks your truth.</p>

                    {alphaBro ? (
                        <div className="alpha-preview">
                            <div className="alpha-info">
                                <h4>{alphaBro.name}</h4>
                                <p>{alphaBro.tagline}</p>
                            </div>
                            {!isLocked && (
                                <button onClick={() => setShowAlphaBuilder(true)}>Edit</button>
                            )}
                        </div>
                    ) : (
                        <button
                            className="create-alpha-btn"
                            onClick={() => setShowAlphaBuilder(true)}
                            disabled={isLocked}
                        >
                            + Create Your Alpha Bro
                        </button>
                    )}
                </div>
            )}

            {showAlphaBuilder && (
                <AlphaBroBuilder
                    template={alphaTemplate}
                    existing={alphaBro}
                    onSave={handleAlphaBroSave}
                    onCancel={() => setShowAlphaBuilder(false)}
                />
            )}

            <div className="selection-footer">
                <div className="selection-count">
                    {selectedSlugs.length} / {MAX_PREBUILT} selected
                </div>

                {!isLocked && (
                    <button
                        className="lock-roster-btn"
                        onClick={handleLockRoster}
                        disabled={selectedSlugs.length === 0 || locking}
                    >
                        {locking ? 'Locking...' : `🔒 Lock Roster for 30 Days`}
                    </button>
                )}
            </div>
        </div>
    );
}

/**
 * AlphaBroBuilder Component
 * Modal for creating custom Alpha Bro character
 */
function AlphaBroBuilder({ template, existing, onSave, onCancel }) {
    const [name, setName] = useState(existing?.name || '');
    const [tagline, setTagline] = useState(existing?.tagline || '');
    const [philosophy, setPhilosophy] = useState(existing?.philosophy || '');
    const [traits, setTraits] = useState(existing?.coreTraits?.join(', ') || '');

    const handleSubmit = (e) => {
        e.preventDefault();

        const customAlpha = {
            ...template,
            id: 'alpha-custom',
            name: name || 'My Alpha Bro',
            tagline: tagline || 'My personal truth.',
            philosophy: philosophy || 'My way. My rules.',
            coreTraits: traits.split(',').map(t => t.trim()).filter(Boolean),
            isCustom: true
        };

        onSave(customAlpha);
    };

    return (
        <div className="alpha-builder-overlay">
            <div className="alpha-builder-modal">
                <h3>Create Your Alpha Bro</h3>
                <p>This is your legacy character. Make it yours.</p>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="What do you call this version of yourself?"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Tagline</label>
                        <input
                            type="text"
                            value={tagline}
                            onChange={e => setTagline(e.target.value)}
                            placeholder="Your battle cry in one line"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Philosophy</label>
                        <textarea
                            value={philosophy}
                            onChange={e => setPhilosophy(e.target.value)}
                            placeholder="What does this Alpha Bro believe?"
                            rows={3}
                        />
                    </div>

                    <div className="form-group">
                        <label>Core Traits (comma separated)</label>
                        <input
                            type="text"
                            value={traits}
                            onChange={e => setTraits(e.target.value)}
                            placeholder="e.g., Resilient, Honest, Builder"
                        />
                    </div>

                    <div className="builder-actions">
                        <button type="button" onClick={onCancel}>Cancel</button>
                        <button type="submit" className="primary">Save Alpha Bro</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CharacterSelection;
