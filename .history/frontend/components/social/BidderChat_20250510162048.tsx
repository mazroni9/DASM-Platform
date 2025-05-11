/**
 * 🧩 مكون الدردشة بين المزايدين
 * 📁 المسار: components/social/BidderChat.tsx
 *
 * ✅ الوظيفة:
 * - توفير محادثة مباشرة بين المزايدين أثناء المزاد
 * - دعم الرسائل النصية والتعبيرات العاطفية (إيموجي)
 * - تمييز رسائل المزايدين بألوان مختلفة لسهولة التتبع
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, Smile, User, X } from 'lucide-react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

// واجهة رسالة المحادثة
interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userColor: string;
  text: string;
  timestamp: Date;
  isModerator?: boolean;
}

interface BidderChatProps {
  auctionId: number;
  onNewMessage?: (message: string) => void;
  currentUserId?: string;
}

export default function BidderChat({ auctionId, onNewMessage, currentUserId = 'user123' }: BidderChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // محاكاة رسائل المحادثة السابقة
  useEffect(() => {
    // بيانات تجريبية للمحادثة
    const mockMessages: ChatMessage[] = [
      {
        id: '1',
        userId: 'user456',
        userName: 'أحمد سعيد',
        userColor: '#4CAF50',
        text: 'السيارة بحالة ممتازة، شاهدتها بالمعرض أمس',
        timestamp: new Date(Date.now() - 15 * 60000)
      },
      {
        id: '2',
        userId: 'user789',
        userName: 'محمد عبدالله',
        userColor: '#2196F3',
        text: 'هل هي السيارة التي كانت معروضة في مزاد الأسبوع الماضي؟',
        timestamp: new Date(Date.now() - 13 * 60000)
      },
      {
        id: '3',
        userId: 'user456',
        userName: 'أحمد سعيد',
        userColor: '#4CAF50',
        text: 'لا، هذه سيارة مختلفة. المالك السابق استخدمها فقط في المدينة',
        timestamp: new Date(Date.now() - 10 * 60000)
      },
      {
        id: '4',
        userId: 'moderator1',
        userName: 'مدير المزاد',
        userColor: '#F44336',
        text: 'نذكر المزايدين أن السيارة تم فحصها من قبل فريق DASM وحصلت على تقييم 9/10',
        timestamp: new Date(Date.now() - 8 * 60000),
        isModerator: true
      },
      {
        id: '5',
        userId: 'user123', // المستخدم الحالي
        userName: 'أنت',
        userColor: '#9C27B0',
        text: 'شكراً للتوضيح، سأشارك في المزايدة',
        timestamp: new Date(Date.now() - 5 * 60000)
      }
    ];

    setMessages(mockMessages);
  }, [auctionId]);

  // قم بالتمرير إلى آخر رسالة عند إضافة رسائل جديدة
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // معالجة النقر خارج منتقي الإيموجي لإغلاقه
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isEmojiPickerOpen &&
        emojiPickerRef.current &&
        emojiButtonRef.current &&
        !emojiPickerRef.current.contains(event.target as Node) &&
        !emojiButtonRef.current.contains(event.target as Node)
      ) {
        setIsEmojiPickerOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEmojiPickerOpen]);

  // محاكاة استلام رسائل جديدة كل 20-40 ثانية (للتجربة فقط)
  useEffect(() => {
    const colors = ['#4CAF50', '#2196F3', '#FF9800', '#795548', '#607D8B'];
    const names = ['خالد محمد', 'عبدالله سعيد', 'عمر أحمد', 'سلطان فهد', 'سعد إبراهيم'];
    const mockMessages = [
      'هذه السيارة قيمتها الحقيقية أعلى من سعر المزايدة الحالي',
      'هل يوجد ضمان إضافي على المحرك؟',
      'أظن أن السيارة ستصل إلى 200 ألف على الأقل',
      'رائعة جداً، السيارة تستحق السعر الحالي وأكثر',
      'السوق حالياً مرتفع لهذا النوع من السيارات',
      'من لديه معلومات أكثر عن تاريخ الصيانة؟',
      'أعتقد أن السعر الحالي منخفض مقارنة بالسوق'
    ];

    const intervalId = setInterval(() => {
      const randomUser = Math.floor(Math.random() * 5);
      const randomMessage = Math.floor(Math.random() * mockMessages.length);
      
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        userId: `mock${randomUser}`,
        userName: names[randomUser],
        userColor: colors[randomUser],
        text: mockMessages[randomMessage],
        timestamp: new Date()
      };

      setMessages(prevMessages => [...prevMessages, newMessage]);
    }, Math.floor(Math.random() * 20000) + 20000); // يظهر كل 20-40 ثانية

    return () => clearInterval(intervalId);
  }, []);

  // إرسال رسالة جديدة
  const sendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (newMessage.trim() === '') return;
    
    const message: ChatMessage = {
      id: Date.now().toString(),
      userId: currentUserId,
      userName: 'أنت',
      userColor: '#9C27B0',
      text: newMessage.trim(),
      timestamp: new Date()
    };
    
    setMessages(prevMessages => [...prevMessages, message]);
    setNewMessage('');
    
    if (onNewMessage) {
      onNewMessage(newMessage);
    }
    
    // هنا يمكن إرسال الرسالة إلى الخادم في التنفيذ الحقيقي
  };

  // إضافة إيموجي إلى الرسالة
  const addEmoji = (emoji: any) => {
    setNewMessage(prev => prev + emoji.native);
    setIsEmojiPickerOpen(false);
  };

  // تنسيق الوقت للعرض
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
  };

  if (!showChat) {
    return (
      <button
        onClick={() => setShowChat(true)}
        className="fixed bottom-4 left-4 bg-teal-500 text-white rounded-full p-3 shadow-lg hover:bg-teal-600 transition-colors z-10"
      >
        <User className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg w-full md:w-80 border border-gray-200 overflow-hidden">
      {/* رأس المحادثة */}
      <div className="bg-teal-600 text-white px-4 py-3 flex justify-between items-center">
        <h3 className="font-bold">محادثة المزايدين</h3>
        <div className="flex space-x-1 rtl:space-x-reverse">
          <button
            onClick={() => setShowChat(false)}
            className="hover:bg-teal-700 p-1 rounded-full"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* مساحة الرسائل */}
      <div
        ref={chatContainerRef}
        className="p-2 h-96 overflow-y-auto bg-gray-50 space-y-2 rtl"
        dir="rtl"
      >
        {messages.map(message => (
          <div key={message.id} className="flex items-start mb-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0 mr-2"
              style={{ backgroundColor: message.userColor }}
            >
              {message.userName.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex items-center">
                <span
                  className="font-medium text-sm"
                  style={{ color: message.userColor }}
                >
                  {message.userName}
                </span>
                {message.isModerator && (
                  <span className="mr-1 bg-red-100 text-red-800 text-xs px-1.5 py-0.5 rounded-full">
                    مشرف
                  </span>
                )}
                <span className="text-xs text-gray-500 mr-2">
                  {formatTime(message.timestamp)}
                </span>
              </div>
              <p className="text-sm mt-1 text-gray-700 break-words">
                {message.text}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* نموذج إرسال الرسائل */}
      <form onSubmit={sendMessage} className="border-t border-gray-200 p-2 relative">
        <div className="flex">
          <button
            type="button"
            ref={emojiButtonRef}
            onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
            className="p-2 text-gray-500 hover:text-gray-700"
          >
            <Smile className="h-5 w-5" />
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="اكتب رسالة..."
            className="flex-1 p-2 border border-gray-300 rounded-l-lg focus:outline-none focus:border-teal-500"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className={`px-3 py-2 rounded-r-lg ${
              !newMessage.trim()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-teal-500 text-white hover:bg-teal-600'
            }`}
          >
            <Send className="h-5 w-5" />
          </button>
        </div>

        {/* منتقي الإيموجي */}
        {isEmojiPickerOpen && (
          <div
            ref={emojiPickerRef}
            className="absolute bottom-12 left-0 z-10 shadow-lg"
          >
            <Picker data={data} onEmojiSelect={addEmoji} theme="light" />
          </div>
        )}
      </form>

      {/* ملاحظة أسفل المحادثة */}
      <div className="p-2 bg-blue-50 text-blue-700 text-xs border-t border-blue-100">
        يرجى الالتزام بقواعد المحادثة والاحترام المتبادل بين المزايدين.
      </div>
    </div>
  );
} 