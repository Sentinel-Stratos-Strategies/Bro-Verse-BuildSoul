import { useState, useCallback } from 'react';
import './CharacterChat.css';
import { generateCharacterResponse } from './llmService';

/**
 * CharacterChat Component
 * Chat interface for interacting with BroVerse characters
 */
export function CharacterChat({ character, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: input.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await generateCharacterResponse(character, userMessage.content);
      
      const characterMessage = {
        id: Date.now() + 1,
        role: 'character',
        content: response,
        characterName: character.name
      };

      setMessages(prev => [...prev, characterMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'system',
        content: 'Connection lost. Try again.'
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, character, isLoading]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="character-chat">
      <div className="chat-header">
        <div className="chat-character-info">
          <span className="chat-character-name">{character.name}</span>
          <span className="chat-character-archetype">{character.archetype}</span>
        </div>
        <button className="chat-close" onClick={onClose}>×</button>
      </div>

      <div className="chat-welcome">
        <p className="chat-tagline">"{character.tagline}"</p>
        <p className="chat-philosophy">{character.philosophy}</p>
      </div>

      <div className="chat-messages">
        {messages.map(msg => (
          <div key={msg.id} className={`chat-message ${msg.role}`}>
            {msg.role === 'character' && (
              <span className="message-author">{msg.characterName}</span>
            )}
            <p className="message-content">{msg.content}</p>
          </div>
        ))}
        {isLoading && (
          <div className="chat-message character loading">
            <span className="message-author">{character.name}</span>
            <p className="message-content">
              <span className="typing-indicator">
                <span></span><span></span><span></span>
              </span>
            </p>
          </div>
        )}
      </div>

      <div className="chat-input-area">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={`Ask ${character.name} something...`}
          rows={2}
          disabled={isLoading}
        />
        <button 
          className="send-btn" 
          onClick={sendMessage}
          disabled={!input.trim() || isLoading}
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default CharacterChat;
