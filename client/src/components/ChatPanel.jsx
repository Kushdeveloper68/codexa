export default function ChatPanel({ messages = [], chatInput, onInputChange, onSend, chatEndRef }) {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface-container-lowest">
        {messages.length === 0 && (
          <p className="font-body-sm text-body-sm text-secondary text-center py-8">No messages yet — say hi!</p>
        )}
        {messages.map((m, i) => (
          <div key={i}>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="font-body-sm text-body-sm font-semibold text-on-surface">{m.senderName}</span>
              <span className="text-[10px] text-secondary">
                {new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant break-words">{m.message}</p>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      <form onSubmit={onSend} className="p-3 md:p-4 border-t border-surface-variant bg-surface shrink-0">
        <div className="relative">
          <input
            value={chatInput}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder="Type a message..."
            className="w-full bg-surface-container-lowest border border-surface-variant rounded-DEFAULT py-2 pl-3 pr-10 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none font-body-sm text-body-sm text-on-surface placeholder:text-outline"
          />
          <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-primary hover:text-primary-container">
            <span className="material-symbols-outlined text-[20px]">send</span>
          </button>
        </div>
      </form>
    </div>
  );
}
