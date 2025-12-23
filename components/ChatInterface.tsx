
import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, User } from '../types';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  currentUser: User;
  otherUserName: string;
  onSendMessage: (text: string) => void;
  onClose: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, currentUser, otherUserName, onSendMessage, onClose }) => {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage(input);
    setInput('');
  };

  return (
    <div className="fixed inset-0 z-[1500] flex flex-col bg-slate-50 dark:bg-slate-950 animate-slide-up">
      {/* Header */}
      <div className="px-5 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/5 flex justify-between items-center shadow-sm safe-pt">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-500 active:scale-90 transition-all">
            <i className="fa-solid fa-arrow-left"></i>
          </button>
          <div>
            <h3 className="text-base font-black italic uppercase text-slate-900 dark:text-white">{otherUserName}</h3>
            <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Connection
            </p>
          </div>
        </div>
        <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
           <i className="fa-solid fa-comment-dots"></i>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-100 dark:bg-slate-950/50" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full opacity-30 space-y-2">
             <i className="fa-regular fa-comments text-4xl"></i>
             <p className="text-xs font-black uppercase tracking-widest">Start the conversation</p>
          </div>
        )}
        {messages.map(msg => {
          const isMe = msg.senderId === currentUser.id;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-4 rounded-2xl text-xs font-medium leading-relaxed shadow-sm ${
                isMe 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200 dark:border-white/5'
              }`}>
                <p>{msg.text}</p>
                <span className={`text-[8px] font-black uppercase tracking-wider block text-right mt-1.5 ${isMe ? 'text-blue-200' : 'text-slate-400'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-white/5 safe-pb">
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-2 rounded-[24px]">
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="flex-1 bg-transparent px-4 py-2 text-sm font-medium outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim()}
            className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg disabled:opacity-50 active:scale-90 transition-all"
          >
            <i className="fa-solid fa-paper-plane text-xs"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
