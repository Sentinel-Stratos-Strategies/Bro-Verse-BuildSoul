import { useState } from 'react';
import { CharacterSelection } from '../components/CharacterSelection';
import characters from '../data/characters.json';
import './HomePage.css';

/**
 * HomePage Component
 * Main landing page for the BroVerse
 */
export function HomePage({ onNavigate }) {
  const [showSelection, setShowSelection] = useState(false);

  const handleSelectionComplete = (roster) => {
    console.log('Roster locked:', roster);
    onNavigate?.('dashboard');
  };

  if (showSelection) {
    return (
      <CharacterSelection
        characters={characters.broverse.characters}
        onSelectionComplete={handleSelectionComplete}
      />
    );
  }

  return (
    <div className="home-page">
      <div className="hero-section">
        <h1 className="hero-title">THE BROVERSE</h1>
        <p className="hero-tagline">
          This isn't therapy. It's sacred construction.
        </p>
        <p className="hero-subtitle">
          You don't join the BroVerse—you remember you were always meant to be here.
        </p>
        
        <button 
          className="cta-button"
          onClick={() => setShowSelection(true)}
        >
          Build Your Roster
        </button>
      </div>

      <div className="features-section">
        <div className="feature-card">
          <span className="feature-icon">👥</span>
          <h3>19 Archetypes + 1 Custom</h3>
          <p>Choose 4 prebuilt characters and create your own Alpha Bro legacy character.</p>
        </div>

        <div className="feature-card">
          <span className="feature-icon">📲</span>
          <h3>Bro Calls</h3>
          <p>3x per week. 7-10 seconds. Miss it, it's gone forever. The universe doesn't wait.</p>
        </div>

        <div className="feature-card">
          <span className="feature-icon">🔒</span>
          <h3>30-Day Lock</h3>
          <p>Commit to your roster. No switching. Growth requires consistency.</p>
        </div>

        <div className="feature-card">
          <span className="feature-icon">🤖</span>
          <h3>AI-Powered</h3>
          <p>Each character speaks with their own voice. Real wisdom. Real growth.</p>
        </div>
      </div>

      <div className="manifesto-section">
        <blockquote>
          "The BroVerse isn't about perfection. It's about resurrection. 
          It's not about becoming someone new—it's about remembering who you were 
          before the world tried to break you."
        </blockquote>
        <cite>— The Sentinel</cite>
      </div>
    </div>
  );
}

export default HomePage;
