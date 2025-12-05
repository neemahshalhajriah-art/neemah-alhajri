import React, { useState, useRef, ChangeEvent, KeyboardEvent } from 'react';
import { Send, Paperclip, X, Image as ImageIcon, FileText, Loader2 } from 'lucide-react';
import { Attachment } from '../types';

interface ChatInputProps {
  onSend: (text: string, attachments: Attachment[]) => void;
  isLoading: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, isLoading }) => {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if ((!text.trim() && attachments.length === 0) || isLoading) return;
    onSend(text, attachments);
    setText('');
    setAttachments([]);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newAttachments: Attachment[] = [];
      
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        
        // Simple validation
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            alert(`File ${file.name} is too large. Max 5MB.`);
            continue;
        }

        try {
          const base64 = await readFileAsBase64(file);
          // Strip base64 prefix for API usage, keep raw for display if needed? 
          // The API needs purely the data part for inlineData, but for text we need the string.
          
          const isImage = file.type.startsWith('image/');
          
          // Remove Data URI prefix (e.g. "data:image/png;base64,") for API consumption
          const base64Data = base64.split(',')[1]; 

          // For text files, we might want the actual text content, not base64
          let contentData = base64Data;
          if (!isImage) {
             const textContent = await readFileAsText(file);
             contentData = textContent;
          }

          newAttachments.push({
            id: Math.random().toString(36).substr(2, 9),
            name: file.name,
            type: isImage ? 'image' : 'text',
            mimeType: file.type,
            data: contentData
          });
        } catch (error) {
          console.error("Error reading file", error);
        }
      }

      setAttachments(prev => [...prev, ...newAttachments]);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  return (
    <div className="bg-white border-t border-slate-200 p-4 pb-6">
      <div className="max-w-4xl mx-auto">
        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {attachments.map((att) => (
              <div key={att.id} className="flex items-center gap-2 bg-slate-100 px-3 py-2 rounded-lg border border-slate-200 animate-fadeIn">
                <div className="text-slate-500">
                    {att.type === 'image' ? <ImageIcon size={16} /> : <FileText size={16} />}
                </div>
                <span className="text-xs font-medium text-slate-700 max-w-[150px] truncate">
                  {att.name}
                </span>
                <button 
                  onClick={() => removeAttachment(att.id)}
                  className="text-slate-400 hover:text-red-500 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="relative flex items-end gap-2 bg-white rounded-2xl border border-slate-300 shadow-sm focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-transparent p-2 transition-all">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
            title="إرفاق ملف (صورة، نص)"
            disabled={isLoading}
          >
            <Paperclip size={20} />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange}
            className="hidden" 
            multiple
            accept="image/*,.csv,.txt,.json,.md" 
          />
          
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="اكتب استفسارك هنا، أو ارفق الجدول للاستعلام عنه..."
            className="w-full max-h-32 bg-transparent border-none focus:ring-0 resize-none py-3 px-2 text-slate-800 placeholder-slate-400 text-right min-h-[50px]"
            rows={1}
            style={{ minHeight: '50px' }}
            disabled={isLoading}
          />
          
          <button 
            onClick={handleSend}
            disabled={isLoading || (!text.trim() && attachments.length === 0)}
            className={`p-3 rounded-xl flex-shrink-0 transition-all ${
              isLoading || (!text.trim() && attachments.length === 0)
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md'
            }`}
          >
            {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} className={text.trim() ? "ml-0.5" : ""} />}
          </button>
        </div>
        <p className="text-xs text-center text-slate-400 mt-2">
            مدعوم بواسطة Gemini 3 Pro
        </p>
      </div>
    </div>
  );
};