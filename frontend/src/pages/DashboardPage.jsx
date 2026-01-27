import { useState } from 'react';
import { CharacterChat } from '../components/LLM';
import { BroCallsManager } from '../components/BroCalls';
import { tracer } from '../telemetry';
import './DashboardPage.css';

// Helper to get initial dashboard state from localStorage
function getInitialDashboardState() {
  const storedRoster = localStorage.getItem('broverse_roster');
  const storedExpiry = localStorage.getItem('broverse_roster_expiry');
  
  return {
    roster: storedRoster ? JSON.parse(storedRoster) : null,
    rosterExpiry: storedExpiry ? new Date(storedExpiry) : null
  };
}

/**
 * DashboardPage Component
 * Main dashboard showing user's roster and options
 */
export function DashboardPage({ onNavigate }) {
  const initialState = getInitialDashboardState();
  const [roster] = useState(initialState.roster);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [rosterExpiry] = useState(initialState.rosterExpiry);

  const getDaysRemaining = () => {
    if (!rosterExpiry) return 0;
    const now = new Date();
    const diff = rosterExpiry - now;
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const handleCharacterClick = (character) => {
    tracer.trackCharacterInteraction('chat_opened', character, { 
      source: 'dashboard_roster' 
    });
    console.log(`Opening chat with ${character.name}`);
    setSelectedCharacter(character);
    setShowChat(true);
  };

  const getAllRosterCharacters = () => {
    if (!roster) return [];
    return [...(roster.prebuilt || []), roster.alphaBro].filter(Boolean);
  };

  if (!roster) {
    return (
      <div className="dashboard-empty">
        <h2>No Roster Selected</h2>
        <p>You haven't built your roster yet. Choose your 4 + 1 to get started.</p>
        <button 
          className="cta-button"
          onClick={() => onNavigate?.('home')}
        >
          Build Your Roster
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <BroCallsManager 
        userRoster={getAllRosterCharacters()} 
        enabled={true} 
      />

      <div className="dashboard-header">
        <h1>Your BroVerse</h1>
        <div className="roster-status">
          🔒 {getDaysRemaining()} days remaining
        </div>
      </div>

      <div className="dashboard-grid">
        <section className="roster-section">
          <h2>Your Roster</h2>
          <p className="section-subtitle">Click a character to chat</p>
          
          <div className="roster-grid">
            {roster.prebuilt?.map(character => (
              <div 
                key={character.id}
                className="roster-card"
                onClick={() => handleCharacterClick(character)}
              >
                <span className="roster-archetype">{character.archetype}</span>
                <h3>{character.name}</h3>
                <p className="roster-tagline">{character.tagline}</p>
              </div>
            ))}
            
            {roster.alphaBro && (
              <div 
                className="roster-card alpha-card"
                onClick={() => handleCharacterClick(roster.alphaBro)}
              >
                <span className="roster-archetype">Alpha Bro</span>
                <h3>{roster.alphaBro.name}</h3>
                <p className="roster-tagline">{roster.alphaBro.tagline}</p>
              </div>
            )}
          </div>
        </section>

        <section className="stats-section">
          <h2>This Week</h2>
          <div className="week-stats">
            <div className="stat-item">
              <span className="stat-number">3</span>
              <span className="stat-label">Bro Calls Coming</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{getDaysRemaining()}</span>
              <span className="stat-label">Days in Roster</span>
            </div>
          </div>
        </section>
      </div>

      {showChat && selectedCharacter && (
        <div className="chat-modal">
          <CharacterChat
            character={selectedCharacter}
            onClose={() => {
              tracer.trackCharacterInteraction('chat_closed', selectedCharacter, {
                source: 'dashboard_roster'
              });
              console.log(`Closing chat with ${selectedCharacter.name}`);
              setShowChat(false);
              setSelectedCharacter(null);
            }}
          />
        </div>
      )}
    </div>
  );
}

export default DashboardPage;
