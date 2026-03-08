import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { getTherapist } from '@/lib/therapists';
import { ArrowLeft, Send, Mic, MicOff, X, AlertTriangle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/therapist-chat`;

export default function TherapistChat() {
  const navigate = useNavigate();
  const { therapistId } = useParams<{ therapistId: string }>();
  const location = useLocation();
  const { user } = useAuth();
  const therapist = getTherapist(therapistId || 'aria');
  const topic = (location.state as any)?.topic || null;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Load or create session
  useEffect(() => {
    if (!user) return;
    loadSession();
  }, [user, therapistId]);

  const loadSession = async () => {
    if (!user) return;
    // Find most recent open session for this therapist
    const { data: sessions } = await supabase
      .from('therapist_sessions')
      .select('id')
      .eq('user_id', user.id)
      .eq('therapist_id', therapistId || 'aria')
      .is('ended_at', null)
      .order('started_at', { ascending: false })
      .limit(1);

    if (sessions && sessions.length > 0) {
      const sid = sessions[0].id;
      setSessionId(sid);
      // Load messages
      const { data: msgs } = await supabase
        .from('therapist_messages')
        .select('role, content')
        .eq('session_id', sid)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      if (msgs && msgs.length > 0) {
        setMessages(msgs.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })));
      } else if (topic) {
        // New session with topic: send initial greeting
        sendInitialGreeting(sid);
      }
    } else {
      // Create new session
      const { data: newSession } = await supabase
        .from('therapist_sessions')
        .insert({ user_id: user.id, therapist_id: therapistId || 'aria', topic })
        .select('id')
        .single();
      if (newSession) {
        setSessionId(newSession.id);
        sendInitialGreeting(newSession.id);
      }
    }
  };

  const sendInitialGreeting = (sid: string) => {
    // Show therapist greeting as first message
    const greeting = topic
      ? `${therapist.greeting} I see you'd like to talk about **${topic}**. I'm here for you — take your time.`
      : `${therapist.greeting} What would you like to explore today?`;
    const msg: Message = { role: 'assistant', content: greeting };
    setMessages([msg]);
    // Persist
    if (user) {
      supabase.from('therapist_messages').insert({
        session_id: sid,
        user_id: user.id,
        role: 'assistant',
        content: greeting,
      });
    }
  };

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading || !sessionId || !user) return;
    setError(null);
    const userMsg: Message = { role: 'user', content: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Persist user message
    await supabase.from('therapist_messages').insert({
      session_id: sessionId,
      user_id: user.id,
      role: 'user',
      content: text.trim(),
    });

    let assistantContent = '';
    const updateAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant' && prev.length > 1 && prev[prev.length - 2]?.role === 'user' && prev[prev.length - 2].content === text.trim()) {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
        }
        return [...prev, { role: 'assistant', content: assistantContent }];
      });
    };

    try {
      const chatMessages = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));

      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: chatMessages, therapistId: therapistId || 'aria', topic }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({ error: 'Something went wrong' }));
        throw new Error(errData.error || `Error ${resp.status}`);
      }

      // Check if it's a crisis (non-streamed) response
      const contentType = resp.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await resp.json();
        const content = data.choices?.[0]?.message?.content || 'I\'m here for you.';
        setMessages(prev => [...prev, { role: 'assistant', content }]);
        assistantContent = content;
      } else {
        // Stream SSE
        const reader = resp.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let streamDone = false;

        while (!streamDone) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let idx: number;
          while ((idx = buffer.indexOf('\n')) !== -1) {
            let line = buffer.slice(0, idx);
            buffer = buffer.slice(idx + 1);
            if (line.endsWith('\r')) line = line.slice(0, -1);
            if (line.startsWith(':') || line.trim() === '') continue;
            if (!line.startsWith('data: ')) continue;
            const json = line.slice(6).trim();
            if (json === '[DONE]') { streamDone = true; break; }
            try {
              const parsed = JSON.parse(json);
              const c = parsed.choices?.[0]?.delta?.content;
              if (c) updateAssistant(c);
            } catch {
              buffer = line + '\n' + buffer;
              break;
            }
          }
        }
      }

      // Persist assistant message
      if (assistantContent) {
        await supabase.from('therapist_messages').insert({
          session_id: sessionId,
          user_id: user.id,
          role: 'assistant',
          content: assistantContent,
        });
      }
    } catch (e: any) {
      console.error('Chat error:', e);
      setError(e.message || 'Failed to get response');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, sessionId, user, messages, therapistId, topic, therapist.greeting]);

  // Speech recognition
  const toggleListening = () => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';
    rec.onresult = (e: any) => {
      const text = e.results[0]?.[0]?.transcript;
      if (text) setInput(prev => prev + text);
      setListening(false);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  };

  const endSession = async () => {
    if (sessionId && user) {
      await supabase
        .from('therapist_sessions')
        .update({ ended_at: new Date().toISOString() })
        .eq('id', sessionId)
        .eq('user_id', user.id);
    }
    navigate(`/therapist/${therapistId}`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col safe-top safe-bottom relative overflow-hidden">
      <div className="ambient-orb w-64 h-64 bg-primary/15 -top-16 -right-16" />
      <div className="ambient-orb w-56 h-56 bg-accent/10 bottom-24 -left-20" />

      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center gap-3 relative z-10 border-b border-border/30">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(`/therapist/${therapistId}`)}
          className="w-9 h-9 rounded-xl glass-card flex items-center justify-center">
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </motion.button>
        <div className="w-9 h-9 rounded-full overflow-hidden border border-primary/20">
          <img src={therapist.avatar} alt={therapist.name} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-foreground text-sm">{therapist.name}</div>
          <div className="text-[11px] text-muted-foreground">{therapist.subtitle}</div>
        </div>
        <motion.button whileTap={{ scale: 0.9 }} onClick={endSession}
          className="w-9 h-9 rounded-xl glass-card flex items-center justify-center">
          <X className="w-4 h-4 text-muted-foreground" />
        </motion.button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 relative z-10">
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-16 h-16 rounded-full overflow-hidden border border-primary/20 mb-4">
              <img src={therapist.avatar} alt={therapist.name} className="w-full h-full object-cover" />
            </div>
            <p className="text-muted-foreground text-sm">Start your conversation with {therapist.name}</p>
          </div>
        )}

        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full overflow-hidden border border-primary/15 shrink-0 mr-2 mt-1">
                  <img src={therapist.avatar} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-lg'
                  : 'glass-card text-foreground rounded-bl-lg'
              }`}>
                {msg.role === 'assistant' ? (
                  <div className="prose prose-sm prose-invert max-w-none [&_p]:m-0 [&_p]:mb-1.5 [&_p:last-child]:mb-0 [&_strong]:text-foreground [&_a]:text-primary">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  msg.content
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-2">
            <div className="w-7 h-7 rounded-full overflow-hidden border border-primary/15 shrink-0">
              <img src={therapist.avatar} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="glass-card rounded-2xl rounded-bl-lg px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </motion.div>
        )}

        {/* Error */}
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-2 mx-auto">
            <div className="glass-card rounded-2xl px-4 py-3 border border-destructive/20 flex items-start gap-2 max-w-sm">
              <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-xs text-destructive">{error}</p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-2 relative z-10 border-t border-border/30">
        <div className="glass-card rounded-2xl flex items-end gap-2 p-2">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={toggleListening}
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
              listening ? 'bg-destructive/20 text-destructive' : 'bg-muted/30 text-muted-foreground'
            }`}
          >
            {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </motion.button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
            }}
            placeholder={`Message ${therapist.name}...`}
            rows={1}
            className="flex-1 bg-transparent border-0 text-foreground text-sm placeholder:text-muted-foreground resize-none focus:outline-none py-2.5 max-h-24"
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            className="w-10 h-10 rounded-xl btn-premium flex items-center justify-center shrink-0 disabled:opacity-40"
          >
            <Send className="w-4 h-4 text-primary-foreground" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
