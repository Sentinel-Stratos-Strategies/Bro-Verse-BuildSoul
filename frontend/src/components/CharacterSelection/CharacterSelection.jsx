import { useState } from 'react';
import './CharacterSelection.css';

// Helper to get initial state from localStorage
function getInitialRosterState() {
  const storedRoster = localStorage.getItem('broverse_roster');
  const storedExpiry = localStorage.getItem('broverse_roster_expiry');

  if (storedRoster && storedExpiry) {
    const expiry = new Date(storedExpiry);
    if (expiry > new Date()) {
      const roster = JSON.parse(storedRoster);
      return {
        selectedCharacters: roster.prebuilt || [],
        alphaBro: roster.alphaBro || null,
        isLocked: true,
        lockExpiry: expiry
      };
    } else {
      // Roster expired, clear it
      localStorage.removeItem('broverse_roster');
      localStorage.removeItem('broverse_roster_expiry');
    }
  }
  
  return {
    selectedCharacters: [],
    alphaBro: null,
    isLocked: false,
    lockExpiry: null
  };
}

/**
 * CharacterSelection Component
 * Users select 4 prebuilt characters + 1 custom Alpha Bro
 * Selection is locked for 30 days
 */
export function CharacterSelection({ characters, onSelectionComplete }) {
  const initialState = getInitialRosterState();
  const [selectedCharacters, setSelectedCharacters] = useState(initialState.selectedCharacters);
  const [alphaBro, setAlphaBro] = useState(initialState.alphaBro);
  const [isLocked, setIsLocked] = useState(initialState.isLocked);
  const [lockExpiry, setLockExpiry] = useState(initialState.lockExpiry);
  const [showAlphaBuilder, setShowAlphaBuilder] = useState(false);

  const MAX_PREBUILT = 4;
  const LOCK_DAYS = 30;

  // Filter out the custom Alpha Bro character template
  const prebuiltCharacters = characters.filter(c => !c.isCustom);
  const alphaTemplate = characters.find(c => c.isCustom);

  const toggleCharacter = (character) => {
    if (isLocked) return;

    setSelectedCharacters(prev => {
      const isSelected = prev.some(c => c.id === character.id);
      if (isSelected) {
        return prev.filter(c => c.id !== character.id);
      }
      if (prev.length >= MAX_PREBUILT) {
        return prev;
      }
      return [...prev, character];
    });
  };

  const handleAlphaBroSave = (customAlpha) => {
    setAlphaBro(customAlpha);
    setShowAlphaBuilder(false);
  };

  const lockRoster = () => {
    if (selectedCharacters.length !== MAX_PREBUILT) {
      alert(`Please select exactly ${MAX_PREBUILT} characters.`);
      return;
    }
    if (!alphaBro) {
      alert('Please create your custom Alpha Bro.');
      return;
    }

    const expiry = new Date();
    expiry.setDate(expiry.getDate() + LOCK_DAYS);

    const roster = {
      prebuilt: selectedCharacters,
      alphaBro: alphaBro
    };

    localStorage.setItem('broverse_roster', JSON.stringify(roster));
    localStorage.setItem('broverse_roster_expiry', expiry.toISOString());

    setIsLocked(true);
    setLockExpiry(expiry);
    onSelectionComplete?.(roster);
  };

  const getDaysRemaining = () => {
    if (!lockExpiry) return 0;
    const now = new Date();
    const diff = lockExpiry - now;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="character-selection">
      <div className="selection-header">
        <h2>Build Your Roster</h2>
        <p className="selection-subtitle">
          Choose 4 archetypes + create 1 custom Alpha Bro. 
          Your roster locks for 30 days.
        </p>
        {isLocked && (
          <div className="lock-status">
            🔒 Roster locked • {getDaysRemaining()} days remaining
          </div>
        )}
      </div>

      <div className="selection-grid">
        {prebuiltCharacters.map(character => {
          const isSelected = selectedCharacters.some(c => c.id === character.id);
          return (
            <div
              key={character.id}
              className={`character-card ${isSelected ? 'selected' : ''} ${isLocked ? 'locked' : ''}`}
              onClick={() => toggleCharacter(character)}
            >
              <div className="character-card-header">
                <span className="character-archetype">{character.archetype}</span>
                {isSelected && <span className="check-mark">✓</span>}
              </div>
              <h3 className="character-name">{character.name}</h3>
              <p className="character-tagline">{character.tagline}</p>
              <div className="character-traits">
                {character.coreTraits.slice(0, 3).map((trait, i) => (
                  <span key={i} className="trait-badge">{trait}</span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

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
          {selectedCharacters.length} / {MAX_PREBUILT} selected
        </div>
        
        {!isLocked && (
          <button 
            className="lock-roster-btn"
            onClick={lockRoster}
            disabled={selectedCharacters.length !== MAX_PREBUILT || !alphaBro}
          >
            🔒 Lock Roster for 30 Days
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
