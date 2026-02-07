export function ChatThread({ messages }) {
    if (!messages || messages.length === 0) {
        return (
            <div className="chat-messages empty">
                <p>Start the conversation. Your Bro is listening.</p>
            </div>
        );
    }

    return (
        <div className="chat-messages">
            {messages.map((msg) => (
                <div key={msg.id} className={`message ${msg.role}`}>
                    <div className="message-bubble">
                        <p>{msg.content}</p>
                        {msg.streaming && <span className="streaming-cursor">|</span>}
                    </div>
                    <span className="message-time">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            ))}
        </div>
    );
}

export default ChatThread;
