import React from 'react';

/**
 * Helper to extract 1-2 letter initials from a name
 */
function getInitials(name = '') {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * ConversationMessage Component
 * Reusable chat message bubble for verification threads.
 *
 * @param {Object} props
 * @param {Object} props.message
 * @param {string} props.message.id
 * @param {string} props.message.senderName - Name of the sender (e.g. "Crystal Florano" or "You")
 * @param {string} [props.message.senderInitials] - Initials (computed if omitted)
 * @param {string} [props.message.senderAvatar] - Optional avatar image URL
 * @param {string} props.message.timestamp - Formatted timestamp (e.g. "Aug 22, 5:10 PM")
 * @param {string} props.message.text - Content of the message
 * @param {boolean} [props.message.isCurrentUser=false] - Whether this message was sent by the viewer
 * @param {string} [props.className]
 */
export default function ConversationMessage({ message, className = '' }) {
  if (!message) return null;

  const isCurrentUser =
    message.isCurrentUser ||
    message.senderName?.toLowerCase() === 'you' ||
    message.isSender === true;

  const initials =
    message.senderInitials || getInitials(message.senderName || (isCurrentUser ? 'You' : 'User'));

  if (isCurrentUser) {
    // Current user's message (Right-aligned, royal blue bubble)
    return (
      <div className={`flex flex-col items-end gap-1 w-full ${className}`}>
        {/* Sender meta on top */}
        <div className="flex items-center gap-1.5 text-[11px] text-[#6E6858]">
          <span>{message.timestamp}</span>
          <span className="font-semibold text-[#23261F]">You</span>
          <div className="w-5 h-5 rounded-full bg-[#284bdc] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
            {initials}
          </div>
        </div>

        {/* Blue message bubble */}
        <div className="max-w-[85%] sm:max-w-[80%] rounded-2xl rounded-tr-xs bg-[#284bdc] text-white px-3.5 py-2.5 text-xs leading-relaxed shadow-2xs text-left">
          <p className="whitespace-pre-wrap break-words">{message.text}</p>
        </div>
      </div>
    );
  }

  // Other person's message (Left-aligned, gray-blue bubble)
  return (
    <div className={`flex items-start gap-2.5 w-full ${className}`}>
      {/* Avatar circle */}
      <div className="w-7 h-7 rounded-full bg-[#eff4ff] text-[#284bdc] border border-[#dbe6fd] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
        {message.senderAvatar ? (
          <img
            src={message.senderAvatar}
            alt={message.senderName}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          initials
        )}
      </div>

      {/* Message content */}
      <div className="flex flex-col items-start gap-1 max-w-[85%] sm:max-w-[80%]">
        {/* Sender meta */}
        <div className="flex items-center gap-2 text-[11px]">
          <span className="font-semibold text-[#23261F]">{message.senderName}</span>
          <span className="text-[#6E6858]">{message.timestamp}</span>
        </div>

        {/* Light bubble */}
        <div className="rounded-2xl rounded-tl-xs bg-[#F1F5F9] text-[#23261F] border border-[#E2E8F0] px-3.5 py-2.5 text-xs leading-relaxed shadow-2xs">
          <p className="whitespace-pre-wrap break-words">{message.text}</p>
        </div>
      </div>
    </div>
  );
}

export { ConversationMessage };
