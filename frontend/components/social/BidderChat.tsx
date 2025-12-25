/**
 * 🧩 مكون الأسئلة والأجوبة حول المزاد
 * 📁 المسار: components/social/BidderChat.tsx
 *
 * ✅ الوظيفة:
 * - توفير نظام أسئلة وأجوبة منظم حول السيارة المعروضة في المزاد
 * - إتاحة اختيار الأسئلة الشائعة من قائمة منسدلة
 * - إمكانية طرح أسئلة مخصصة مع فلترة للمعلومات الشخصية
 * - عرض الأسئلة والإجابات لجميع المزايدين لزيادة الشفافية
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, ChevronDown, User, X, MessageSquare, CheckCircle, AlertCircle, HelpCircle } from 'lucide-react';

// واجهة السؤال/الاستفسار
interface Question {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: Date;
  isAnswered: boolean;
  answer?: {
    text: string;
    timestamp: Date;
    answeredBy: 'moderator' | 'seller';
    answererName: string;
  };
  status: 'pending' | 'answered' | 'rejected';
}

// مجموعة الأسئلة الشائعة المعدة مسبقاً
const COMMON_QUESTIONS = [
  'هل السيارة خالية من الحوادث؟',
  'كم المسافة المقطوعة (الكيلومترات)؟',
  'هل تم عمل صيانة دورية للسيارة؟',
  'هل يوجد ضمان إضافي على المحرك؟',
  'ما حالة الإطارات والبطارية؟',
  'هل تمت إضافة أي تعديلات على السيارة؟',
  'هل الطلاء أصلي بالكامل؟',
  'هل توجد أي أعطال في الكهرباء أو التكييف؟',
  'هل السيارة مستعملة من قبل شخص أو شركة؟',
  'هل تتوفر تقارير فحص إضافية؟'
];

// الكلمات المحظورة التي قد تشير إلى معلومات اتصال
const BLOCKED_TERMS = [
  'واتساب', 'واتس', 'whatsapp', 'رقمي', 'تلفون', 'موبايل', 'جوال', 'هاتفي', 'اتصل', 'اتصال',
  'ايميل', 'بريد', 'email', '@', 'انستا', 'انستغرام', 'instagram', 'تويتر', 'twitter',
  'تلغرام', 'telegram', '05', '966', '+966', '00966', 'facebook', 'فيسبوك', 'snapchat', 'سناب'
];

interface BidderChatProps {
  auctionId: number;
  onNewQuestion?: (question: string) => void;
  currentUserId?: string;
}

export default function BidderChat({ auctionId, onNewQuestion, currentUserId = 'user123' }: BidderChatProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [selectedCommonQuestion, setSelectedCommonQuestion] = useState('');
  const [showChat, setShowChat] = useState(true);
  const [hasBlockedTerm, setHasBlockedTerm] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // محاكاة أسئلة سابقة
  useEffect(() => {
    // بيانات تجريبية للأسئلة والإجابات
    const mockQuestions: Question[] = [
      {
        id: '1',
        userId: 'user456',
        userName: 'أحمد سعيد',
        text: 'هل السيارة خالية من الحوادث؟',
        timestamp: new Date(Date.now() - 15 * 60000),
        isAnswered: true,
        answer: {
          text: 'نعم، السيارة خالية تماماً من الحوادث وتم فحصها من قبل وكالة معتمدة',
          timestamp: new Date(Date.now() - 14 * 60000),
          answeredBy: 'seller',
          answererName: 'البائع: فهد العتيبي'
        },
        status: 'answered'
      },
      {
        id: '2',
        userId: 'user789',
        userName: 'محمد عبدالله',
        text: 'كم المسافة المقطوعة؟',
        timestamp: new Date(Date.now() - 13 * 60000),
        isAnswered: true,
        answer: {
          text: 'المسافة المقطوعة 75,000 كم، وجميع الصيانات موثقة لدى الوكيل',
          timestamp: new Date(Date.now() - 12 * 60000),
          answeredBy: 'moderator',
          answererName: 'مشرف المزاد'
        },
        status: 'answered'
      },
      {
        id: '3',
        userId: 'user456',
        userName: 'أحمد سعيد',
        text: 'هل تم عمل صيانة دورية للسيارة؟',
        timestamp: new Date(Date.now() - 10 * 60000),
        isAnswered: false,
        status: 'pending'
      },
      {
        id: '4',
        userId: 'user123', // المستخدم الحالي
        userName: 'أنت',
        text: 'هل الطلاء أصلي بالكامل؟',
        timestamp: new Date(Date.now() - 5 * 60000),
        isAnswered: true,
        answer: {
          text: 'نعم، الطلاء أصلي بالكامل باستثناء الرفرف الأمامي الأيمن تم إعادة طلائه بسبب خدش بسيط',
          timestamp: new Date(Date.now() - 4 * 60000),
          answeredBy: 'seller',
          answererName: 'البائع: فهد العتيبي'
        },
        status: 'answered'
      }
    ];

    setQuestions(mockQuestions);
  }, [auctionId]);

  // قم بالتمرير إلى آخر سؤال عند إضافة أسئلة جديدة
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [questions]);

  // معالجة النقر خارج القائمة المنسدلة لإغلاقها
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  // محاكاة استلام إجابات جديدة كل 30-60 ثانية (للتجربة فقط)
  useEffect(() => {
    const intervalId = setInterval(() => {
      setQuestions(prevQuestions => {
        // البحث عن سؤال معلق (لم تتم الإجابة عليه)
        const pendingQuestionIndex = prevQuestions.findIndex(q => !q.isAnswered);
        if (pendingQuestionIndex === -1) return prevQuestions;

        // إنشاء نسخة جديدة من الأسئلة
        const updatedQuestions = [...prevQuestions];
        const answererType = Math.random() > 0.5 ? 'seller' : 'moderator';
        const answererName = answererType === 'seller' ? 'البائع: فهد العتيبي' : 'مشرف المزاد';

        // إنشاء إجابة عشوائية
        const answers = [
          'تم التأكد من ذلك، السيارة في حالة ممتازة',
          'نعم، جميع الأوراق متوفرة ومعتمدة',
          'لا، هذه الميزة غير متوفرة في هذا الموديل',
          'التقرير الفني يؤكد سلامة المحرك وجميع القطع الميكانيكية',
          'السيارة تم صيانتها بالكامل قبل عرضها في المزاد'
        ];
        const randomAnswer = answers[Math.floor(Math.random() * answers.length)];

        // تحديث السؤال بالإجابة
        updatedQuestions[pendingQuestionIndex] = {
          ...updatedQuestions[pendingQuestionIndex],
          isAnswered: true,
          answer: {
            text: randomAnswer,
            timestamp: new Date(),
            answeredBy: answererType as 'moderator' | 'seller',
            answererName
          },
          status: 'answered'
        };

        return updatedQuestions;
      });
    }, Math.floor(Math.random() * 30000) + 30000); // يظهر كل 30-60 ثانية

    return () => clearInterval(intervalId);
  }, []);

  // التحقق من وجود كلمات محظورة
  const checkForBlockedTerms = (text: string): boolean => {
    const lowerCaseText = text.toLowerCase();
    return BLOCKED_TERMS.some(term => lowerCaseText.includes(term.toLowerCase()));
  };

  // إرسال سؤال جديد
  const sendQuestion = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    let questionText = newQuestion.trim();
    
    // استخدام السؤال من القائمة المنسدلة إذا تم اختياره
    if (selectedCommonQuestion) {
      questionText = selectedCommonQuestion;
    }
    
    if (questionText === '') return;
    
    // التحقق من وجود معلومات اتصال
    if (checkForBlockedTerms(questionText)) {
      setHasBlockedTerm(true);
      return;
    }
    
    const question: Question = {
      id: Date.now().toString(),
      userId: currentUserId,
      userName: 'أنت',
      text: questionText,
      timestamp: new Date(),
      isAnswered: false,
      status: 'pending'
    };
    
    setQuestions(prevQuestions => [...prevQuestions, question]);
    setNewQuestion('');
    setSelectedCommonQuestion('');
    setHasBlockedTerm(false);
    
    if (onNewQuestion) {
      onNewQuestion(questionText);
    }
    
    // هنا يمكن إرسال السؤال إلى الخادم في التنفيذ الحقيقي
  };

  // اختيار سؤال من القائمة المنسدلة
  const selectCommonQuestion = (question: string) => {
    setSelectedCommonQuestion(question);
    setDropdownOpen(false);
  };

  // تنسيق الوقت للعرض
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
  };

  if (!showChat) {
    return (
      <button
        onClick={() => setShowChat(true)}
        title="فتح نافذة الأسئلة والأجوبة"
        className="fixed bottom-4 left-4 bg-teal-500 text-white rounded-full p-3 shadow-lg hover:bg-teal-600 transition-colors z-10"
      >
        <MessageSquare className="h-6 w-6" />
        <span className="sr-only">فتح نافذة الأسئلة والأجوبة</span>
      </button>
    );
  }

  return (
    <div className="bg-card rounded-lg shadow-lg w-full border border-border overflow-hidden">
      {/* رأس المكون */}
      <div className="bg-primary text-white px-4 py-3 flex justify-between items-center">
        <h3 className="font-bold flex items-center">
          <HelpCircle className="h-5 w-5 mr-2" />
          أسئلة حول السيارة
        </h3>
        <div className="flex space-x-1 rtl:space-x-reverse">
          <button
            onClick={() => setShowChat(false)}
            title="إغلاق نافذة الأسئلة والأجوبة"
            className="hover:bg-primary/80 p-1 rounded-full"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">إغلاق</span>
          </button>
        </div>
      </div>

      {/* مساحة الأسئلة والأجوبة */}
      <div
        ref={chatContainerRef}
        className="p-3 h-96 overflow-y-auto bg-background space-y-3"
        dir="rtl"
      >
        {questions.length === 0 && (
          <div className="text-center p-4 text-foreground/50">
            <HelpCircle className="h-10 w-10 mx-auto mb-2 opacity-20" />
            <p>لا توجد أسئلة حتى الآن. كن أول من يسأل عن هذه السيارة!</p>
          </div>
        )}

        {questions.map(question => (
          <div key={question.id} className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
            {/* رأس السؤال */}
            <div className="p-3 border-b border-border bg-background/50 flex items-start justify-between">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center text-primary flex-shrink-0 ml-2">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center">
                    <span className="font-medium text-sm text-foreground/80">{question.userName}</span>
                    <span className="text-xs text-foreground/50 mr-2">
                      {formatTime(question.timestamp)}
                    </span>
                  </div>
                </div>
              </div>

              {/* مؤشر حالة السؤال */}
              <div className="flex items-center">
                {question.status === 'pending' && (
                  <span className="px-2 py-1 text-xs bg-yellow-500/10 text-yellow-600 rounded-full flex items-center">
                    <AlertCircle className="h-3 w-3 ml-1" />
                    في انتظار الإجابة
                  </span>
                )}
                {question.status === 'answered' && (
                  <span className="px-2 py-1 text-xs bg-green-500/10 text-green-600 rounded-full flex items-center">
                    <CheckCircle className="h-3 w-3 ml-1" />
                    تمت الإجابة
                  </span>
                )}
              </div>
            </div>

            {/* نص السؤال */}
            <div className="p-3">
              <p className="text-sm text-foreground/80 mb-2">{question.text}</p>

              {/* الإجابة إذا وجدت */}
              {question.isAnswered && question.answer && (
                <div className="mt-3 bg-background p-3 rounded-lg border-r-2 border-primary">
                  <div className="flex items-center mb-1">
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center text-white flex-shrink-0 ml-2 
                      ${question.answer.answeredBy === 'moderator' ? 'bg-red-500' : 'bg-green-500'}`}>
                      {question.answer.answeredBy === 'moderator' ? 'M' : 'B'}
                    </div>
                    <div className="flex items-center justify-between w-full">
                      <span className={`text-sm font-medium ${
                        question.answer.answeredBy === 'moderator' ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {question.answer.answererName}
                      </span>
                      <span className="text-xs text-foreground/50">
                        {formatTime(question.answer.timestamp)}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-foreground/80 pr-8">{question.answer.text}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* نموذج إرسال الأسئلة */}
      <form onSubmit={sendQuestion} className="border-t border-border p-3 relative">
        {hasBlockedTerm && (
          <div className="mb-2 p-2 bg-red-500/10 text-red-600 text-xs rounded-md">
            <AlertCircle className="h-4 w-4 inline ml-1" />
            يرجى عدم مشاركة معلومات الاتصال الشخصية في الأسئلة.
          </div>
        )}

        {/* قائمة الأسئلة الشائعة */}
        <div className="mb-2 relative" ref={dropdownRef}>
          <div
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className={`p-2 border ${selectedCommonQuestion ? 'border-primary/30 bg-primary/10' : 'border-border'} 
              rounded-lg cursor-pointer flex justify-between items-center hover:bg-border`}
          >
            <span className={`text-sm ${selectedCommonQuestion ? 'text-primary' : 'text-foreground/70'}`}>
              {selectedCommonQuestion || 'اختر من الأسئلة الشائعة'}
            </span>
            <ChevronDown className="h-4 w-4 text-foreground/70" />
          </div>
          
          {dropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 border border-border rounded-lg bg-card shadow-lg z-10 max-h-52 overflow-y-auto">
              {COMMON_QUESTIONS.map((question, index) => (
                <div
                  key={index}
                  onClick={() => selectCommonQuestion(question)}
                  className="p-2 hover:bg-border text-sm cursor-pointer border-b last:border-0 border-border"
                >
                  {question}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex">
          <input
            type="text"
            value={newQuestion}
            onChange={(e) => {
              setNewQuestion(e.target.value);
              setHasBlockedTerm(checkForBlockedTerms(e.target.value));
            }}
            placeholder="أو اكتب سؤالك الخاص..."
            className={`flex-1 p-2 border ${hasBlockedTerm ? 'border-red-300' : 'border-border'} 
              rounded-r-none rounded-lg focus:outline-none bg-background ${
                hasBlockedTerm ? 'focus:border-red-500' : 'focus:border-primary'
              }`}
          />
          <button
            type="submit"
            title="إرسال السؤال"
            disabled={
              (newQuestion.trim() === '' && selectedCommonQuestion === '') || 
              hasBlockedTerm
            }
            className={`px-4 py-2 rounded-l-lg ${
              (newQuestion.trim() === '' && selectedCommonQuestion === '') || hasBlockedTerm
                ? 'bg-border text-foreground/50 cursor-not-allowed'
                : 'bg-primary text-white hover:bg-primary/90'
            }`}
          >
            <Send className="h-5 w-5" />
            <span className="sr-only">إرسال</span>
          </button>
        </div>

        {/* نص مساعدة */}
        <div className="mt-2 text-xs text-foreground/50 flex items-center">
          <AlertCircle className="h-3 w-3 ml-1 flex-shrink-0" />
          <span>
            الأسئلة المتعلقة بالسيارة فقط. ستظهر الإجابة من البائع أو مشرف المزاد قريباً.
          </span>
        </div>
      </form>

      {/* ملاحظة أسفل المكون */}
      <div className="p-2 bg-primary/10 text-primary text-xs border-t border-primary/20">
        جميع الأسئلة والإجابات تخضع لمراقبة مشرفي المنصة. يرجى الالتزام بقواعد الاستخدام.
      </div>
    </div>
  );
} 