import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Message, Role } from '../types';
import { User, Bot, FileText, Image as ImageIcon } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isModel = message.role === Role.MODEL;

  return (
    <div className={`flex w-full mb-6 ${isModel ? 'justify-start' : 'justify-end'}`}>
      <div className={`flex max-w-[85%] md:max-w-[75%] ${isModel ? 'flex-row' : 'flex-row-reverse'} gap-3`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
          isModel ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
        }`}>
          {isModel ? <Bot size={24} /> : <User size={24} />}
        </div>

        {/* Content Bubble */}
        <div className={`flex flex-col ${isModel ? 'items-start' : 'items-end'}`}>
          <div className={`px-5 py-4 rounded-2xl shadow-sm text-sm md:text-base leading-relaxed ${
            isModel 
              ? 'bg-white border border-slate-100 text-slate-800 rounded-tl-none' 
              : 'bg-emerald-600 text-white rounded-tr-none'
          }`}>
            {/* Attachments Display */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {message.attachments.map((att) => (
                  <div key={att.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${
                    isModel ? 'bg-slate-100 text-slate-700' : 'bg-emerald-700/50 text-emerald-100'
                  }`}>
                    {att.type === 'image' ? <ImageIcon size={14} /> : <FileText size={14} />}
                    <span className="truncate max-w-[150px]">{att.name}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Markdown Text */}
            <div className={`markdown-content ${isModel ? 'prose prose-sm prose-slate max-w-none' : ''}`}>
              {isModel ? (
                <ReactMarkdown>{message.content}</ReactMarkdown>
              ) : (
                <p className="whitespace-pre-wrap">{message.content}</p>
              )}
            </div>
          </div>
          
          <span className="text-xs text-slate-400 mt-1 px-1">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};