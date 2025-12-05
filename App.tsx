import React, { useState, useEffect, useRef } from 'react';
import { streamChatResponse } from './services/gemini';
import { Message, Role, Attachment } from './types';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { Info, School, Users, Clock, Calendar, ClipboardList, Search, X } from 'lucide-react';

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: Role.MODEL,
      content: 'أهلاً بك في مدرسة النوابغ للتعليم الأساسي. 🏫\n\nأنا المساعد الذكي، هنا للإجابة على استفساراتك حول جداول الحصص، الفعاليات، أو أي شأن يخص أبناءنا الطلبة. كيف يمكنني مساعدتك اليوم؟',
      timestamp: new Date(),
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    // Only scroll to bottom if not searching
    if (!searchQuery) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, searchQuery]);

  const handleSendMessage = async (text: string, attachments: Attachment[]) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      content: text,
      timestamp: new Date(),
      attachments: attachments
    };

    setMessages(prev => [...prev, userMessage]);
    setSearchQuery(''); // Clear search on new message
    setIsLoading(true);

    try {
      const botMessageId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, {
        id: botMessageId,
        role: Role.MODEL,
        content: '',
        timestamp: new Date()
      }]);

      let fullResponse = '';
      
      await streamChatResponse(
        messages, 
        text,
        attachments,
        (chunk) => {
          fullResponse += chunk;
          setMessages(prev => prev.map(msg => 
            msg.id === botMessageId 
              ? { ...msg, content: fullResponse }
              : msg
          ));
        }
      );

    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: Role.MODEL,
        content: 'عذراً، حدث خطأ بسيط. يرجى المحاولة مرة أخرى.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (prompt: string) => {
    if (isLoading) return;
    handleSendMessage(prompt, []);
  };

  const filteredMessages = messages.filter(msg => 
    msg.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar - Decorative for this demo */}
      <aside className="hidden md:flex flex-col w-72 bg-emerald-900 text-white p-6">
        <div className="flex items-center gap-3 mb-10">
          <div className="bg-white/10 p-2 rounded-lg">
            <School size={28} className="text-emerald-200" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">مدرسة النوابغ</h1>
            <p className="text-xs text-emerald-300 opacity-80">للتعليم الأساسي</p>
          </div>
        </div>

        <nav className="flex-1 space-y-3">
           <div className="px-2 text-xs font-semibold text-emerald-300/80 mb-1">الوصول السريع</div>
           <button 
             onClick={() => handleQuickAction('أريد معرفة تفاصيل جداول المعلمات وأوقات الفراغ.')}
             className="w-full text-right bg-emerald-800/30 hover:bg-emerald-800/50 text-emerald-50 px-4 py-3 rounded-xl flex items-center gap-3 font-medium cursor-pointer transition-colors border border-emerald-700/30"
           >
             <Users size={20} />
             <span>جداول المعلمات</span>
           </button>
           <button 
             onClick={() => handleQuickAction('ما هو توقيت الحصص اليومي والجدول المدرسي؟')}
             className="w-full text-right bg-emerald-800/30 hover:bg-emerald-800/50 text-emerald-50 px-4 py-3 rounded-xl flex items-center gap-3 font-medium cursor-pointer transition-colors border border-emerald-700/30"
           >
             <Clock size={20} />
             <span>توقيت الحصص</span>
           </button>
           <button 
             onClick={() => handleQuickAction('أريد جدول الاختبارات النهائية للفصل الدراسي الأول للصفوف من 5 إلى 11.')}
             className="w-full text-right bg-emerald-800/30 hover:bg-emerald-800/50 text-emerald-50 px-4 py-3 rounded-xl flex items-center gap-3 font-medium cursor-pointer transition-colors border border-emerald-700/30"
           >
             <ClipboardList size={20} />
             <span>جدول الاختبارات</span>
           </button>
           <button 
             onClick={() => handleQuickAction('متى تبدأ إجازة منتصف العام ونهاية العام؟')}
             className="w-full text-right bg-emerald-800/30 hover:bg-emerald-800/50 text-emerald-50 px-4 py-3 rounded-xl flex items-center gap-3 font-medium cursor-pointer transition-colors border border-emerald-700/30"
           >
             <Calendar size={20} />
             <span>التقويم المدرسي</span>
           </button>
        </nav>

        <div className="mt-auto bg-emerald-800/50 p-4 rounded-xl text-xs text-emerald-100 leading-5 border border-emerald-700">
          <div className="flex items-center gap-2 mb-2 text-white font-bold">
            <Info size={14} />
            <span>نحن هنا لخدمتكم</span>
          </div>
          نسعى لتوفير بيئة تعليمية متميزة لأبنائكم.
          <ul className="list-disc list-inside mt-2 space-y-1 opacity-80">
            <li>يمكنك إرفاق صور التعاميم للاستفسار عنها.</li>
          </ul>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col h-full relative">
        {/* Header (Mobile) */}
        <header className="md:hidden bg-emerald-900 text-white p-4 flex items-center gap-3 shadow-md z-10">
          <School size={24} />
          <div>
            <h1 className="font-bold text-base">مدرسة النوابغ للتعليم الأساسي</h1>
          </div>
        </header>

        {/* Search Bar */}
        <div className="px-4 pt-4 md:px-8 md:pt-6 z-0">
          <div className="relative max-w-4xl mx-auto">
            <div className="absolute right-3 top-2.5 text-slate-400 pointer-events-none">
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder="بحث في المحادثة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl py-2 pr-10 pl-10 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm text-sm transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scrollbar-thin scrollbar-thumb-slate-300">
          <div className="max-w-4xl mx-auto flex flex-col pb-4">
             {filteredMessages.length === 0 ? (
               <div className="text-center text-slate-400 mt-10">
                 <Search size={40} className="mx-auto mb-2 opacity-20" />
                 <p>لا توجد نتائج مطابقة لبحثك</p>
               </div>
             ) : (
               filteredMessages.map((msg) => (
                 <ChatMessage key={msg.id} message={msg} />
               ))
             )}
             <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Quick Actions (Mobile/Desktop visible near input) */}
        <div className="max-w-4xl mx-auto w-full px-4 mb-2 flex gap-2 overflow-x-auto py-1">
            <button
              onClick={() => handleQuickAction('أريد معرفة تفاصيل جداول المعلمات وأوقات الفراغ للتواصل معهن.')}
              disabled={isLoading}
              className="flex-shrink-0 bg-white border border-emerald-200 text-emerald-700 px-4 py-2 rounded-full text-sm font-medium hover:bg-emerald-50 transition-colors shadow-sm flex items-center gap-2 whitespace-nowrap"
            >
              <Users size={16} />
              جداول المعلمات
            </button>
            <button
              onClick={() => handleQuickAction('ما هو توقيت الحصص اليومي (الطابور، الحصص، الفسحة)؟')}
              disabled={isLoading}
              className="flex-shrink-0 bg-white border border-emerald-200 text-emerald-700 px-4 py-2 rounded-full text-sm font-medium hover:bg-emerald-50 transition-colors shadow-sm flex items-center gap-2 whitespace-nowrap"
            >
              <Clock size={16} />
              توقيت الحصص
            </button>
            <button
              onClick={() => handleQuickAction('أريد جدول الاختبارات النهائية للفصل الدراسي الأول للصفوف من 5 إلى 11.')}
              disabled={isLoading}
              className="flex-shrink-0 bg-white border border-emerald-200 text-emerald-700 px-4 py-2 rounded-full text-sm font-medium hover:bg-emerald-50 transition-colors shadow-sm flex items-center gap-2 whitespace-nowrap"
            >
              <ClipboardList size={16} />
              جدول الاختبارات
            </button>
            <button
              onClick={() => handleQuickAction('متى تبدأ إجازة منتصف العام ونهاية العام؟')}
              disabled={isLoading}
              className="flex-shrink-0 bg-white border border-emerald-200 text-emerald-700 px-4 py-2 rounded-full text-sm font-medium hover:bg-emerald-50 transition-colors shadow-sm flex items-center gap-2 whitespace-nowrap"
            >
              <Calendar size={16} />
              التقويم المدرسي
            </button>
        </div>

        {/* Input Area */}
        <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
      </main>
    </div>
  );
}