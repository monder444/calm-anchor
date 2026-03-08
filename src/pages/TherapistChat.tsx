import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { useSpeech } from '@/hooks/use-speech';
import { supabase } from '@/integrations/supabase/client';
import { getTherapist } from '@/lib/therapists';
import { ArrowLeft, Send, Mic, MicOff, X, AlertTriangle, Keyboard, ChevronRight, Volume2, VolumeX } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  fromVoice?: boolean;
}

type VoiceState = 'idle' | 'listening' | 'processing' | 'ai-responding' | 'ai-speaking' | 'error' | 'permission-denied';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/therapist-chat`;

export default function TherapistChat() {
  const navigate = useNavigate();
  const { therapistId } = useParams<{ therapistId: string }>();
  const location = useLocation();
  const { user } = useAuth();
  const { speak, stop: stopSpeaking } = useSpeech();
  const therapist = getTherapist(therapistId || 'aria');
  const topic = (location.state as any)?.topic || null;
  const startInVoiceMode = (location.state as any)?.voiceMode || false;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'text' | 'voice'>(startInVoiceMode ? 'voice' : 'text');
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const latestAssistantRef = useRef<string>('');

  // Load or create session
  useEffect(() => {
    if (!user) return;
    loadSession();
  }, [user, therapistId]);

  // Stop TTS on unmount
  useEffect(() => {
    return () => { stopSpeaking(); };
  }, [stopSpeaking]);

  const loadSession = async () => {
    if (!user) return;
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
      const { data: msgs } = await supabase
        .from('therapist_messages')
        .select('role, content')
        .eq('session_id', sid)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      if (msgs && msgs.length > 0) {
        setMessages(msgs.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })));
      } else if (topic) {
        sendInitialGreeting(sid);
      }
    } else {
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
    const greeting = topic
      ? `${therapist.greeting} I see you'd like to talk about **${topic}**. I'm here for you — take your time.`
      : `${therapist.greeting} What would you like to explore today?`;
    const msg: Message = { role: 'assistant', content: greeting };
    setMessages([msg]);
    if (user) {
      supabase.from('therapist_messages').insert({
        session_id: sid, user_id: user.id, role: 'assistant', content: greeting,
      });
    }
    // Speak greeting in voice mode
    if (startInVoiceMode && ttsEnabled) {
      speak(greeting.replace(/\*\*/g, ''), undefined, therapistId || 'aria');
    }
  };

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async (text: string, fromVoice = false) => {
    if (!text.trim() || isLoading || !sessionId || !user) return;
    setError(null);
    const userMsg: Message = { role: 'user', content: text.trim(), fromVoice };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    if (mode === 'voice') setVoiceState('ai-responding');

    await supabase.from('therapist_messages').insert({
      session_id: sessionId, user_id: user.id, role: 'user', content: text.trim(),
    });

    let assistantContent = '';
    const updateAssistant = (chunk: string) => {
      assistantContent += chunk;
      latestAssistantRef.current = assistantContent;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant' && prev.length > 1 && prev[prev.length - 2]?.role === 'user') {
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

      const contentType = resp.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await resp.json();
        const content = data.choices?.[0]?.message?.content || "I'm here for you.";
        setMessages(prev => [...prev, { role: 'assistant', content }]);
        assistantContent = content;
      } else {
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

      // Persist
      if (assistantContent) {
        await supabase.from('therapist_messages').insert({
          session_id: sessionId, user_id: user.id, role: 'assistant', content: assistantContent,
        });
      }

      // TTS for voice mode — use onEnd callback instead of timeout
      if (ttsEnabled && (mode === 'voice' || fromVoice)) {
        setVoiceState('ai-speaking');
        const plainText = assistantContent.replace(/\*\*/g, '').replace(/[#\[\]()]/g, '').replace(/\n+/g, ' ');
        speak(plainText, () => setVoiceState('idle'), therapistId || 'aria');
      } else {
        setVoiceState('idle');
      }
    } catch (e: any) {
      console.error('Chat error:', e);
      setError(e.message || 'Failed to get response');
      setVoiceState('error');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, sessionId, user, messages, therapistId, topic, therapist.greeting, mode, ttsEnabled, speak]);

  // Voice recording via Web Speech API
  const startListening = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setVoiceState('permission-denied');
      setError('Speech recognition not supported in this browser');
      return;
    }

    stopSpeaking(); // Stop any ongoing TTS

    const rec = new SR();
    rec.continuous = true;       // Let user speak freely without cutoff
    rec.interimResults = false;
    rec.lang = 'en-US';

    let finalTranscript = '';
    let silenceTimer: ReturnType<typeof setTimeout> | null = null;

    rec.onstart = () => {
      finalTranscript = '';
      setVoiceState('listening');
    };

    rec.onresult = (e: any) => {
      // Accumulate all final results
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          finalTranscript += e.results[i][0].transcript + ' ';
        }
      }
      // Reset silence timer — wait for user to finish speaking
      if (silenceTimer) clearTimeout(silenceTimer);
      silenceTimer = setTimeout(() => {
        rec.stop();
      }, 2000); // 2s of silence = user is done
    };

    rec.onerror = (e: any) => {
      if (silenceTimer) clearTimeout(silenceTimer);
      if (e.error === 'not-allowed') {
        setVoiceState('permission-denied');
        setError('Microphone access denied. Please allow microphone in your browser settings.');
      } else if (e.error !== 'aborted') {
        setVoiceState('error');
        setError('Voice recording failed. Try again or switch to text.');
      }
    };

    rec.onend = () => {
      if (silenceTimer) clearTimeout(silenceTimer);
      const text = finalTranscript.trim();
      if (text) {
        setVoiceState('processing');
        sendMessage(text, true);
      } else {
        setVoiceState('idle');
      }
    };

    recognitionRef.current = rec;
    rec.start();
  }, [stopSpeaking, sendMessage]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setVoiceState('idle');
  }, []);

  const handleMicPress = useCallback(() => {
    if (voiceState === 'listening') {
      stopListening();
    } else if (voiceState === 'idle' || voiceState === 'error') {
      startListening();
    } else if (voiceState === 'ai-speaking') {
      stopSpeaking();
      setVoiceState('idle');
    }
  }, [voiceState, startListening, stopListening, stopSpeaking]);

  const switchToText = () => {
    stopSpeaking();
    stopListening();
    setVoiceState('idle');
    setMode('text');
  };

  const switchToVoice = () => {
    setMode('voice');
    setVoiceState('idle');
  };

  const endSession = async () => {
    stopSpeaking();
    if (sessionId && user) {
      await supabase.from('therapist_sessions').update({ ended_at: new Date().toISOString() }).eq('id', sessionId).eq('user_id', user.id);
    }
    navigate(`/therapist/${therapistId}`);
  };

  const replayLastResponse = () => {
    if (latestAssistantRef.current && ttsEnabled) {
      const plainText = latestAssistantRef.current.replace(/\*\*/g, '').replace(/[#\[\]()]/g, '').replace(/\n+/g, ' ');
      setVoiceState('ai-speaking');
      speak(plainText, () => setVoiceState('idle'));
    }
  };

  const voiceStateLabel = (): string => {
    switch (voiceState) {
      case 'listening': return 'Listening…';
      case 'processing': return 'Processing…';
      case 'ai-responding': return `${therapist.name} is thinking…`;
      case 'ai-speaking': return `${therapist.name} is speaking…`;
      case 'error': return 'Tap to try again';
      case 'permission-denied': return 'Microphone access needed';
      default: return `Tap to talk with ${therapist.name}`;
    }
  };

  return (
    <div className="min-h-screen flex flex-col safe-top safe-bottom relative overflow-hidden">
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
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setTtsEnabled(!ttsEnabled)}
          className="w-9 h-9 rounded-xl glass-card flex items-center justify-center"
          title={ttsEnabled ? 'Mute voice' : 'Enable voice'}>
          {ttsEnabled ? <Volume2 className="w-4 h-4 text-muted-foreground" /> : <VolumeX className="w-4 h-4 text-muted-foreground" />}
        </motion.button>
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
                  <span>{msg.content}{msg.fromVoice && <Mic className="w-3 h-3 inline ml-1 opacity-40" />}</span>
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

      {/* ─── Input area ─── */}
      {mode === 'voice' ? (
        /* ═══ VOICE MODE CONTROLS ═══ */
        <div className="px-4 pb-6 pt-3 relative z-10">
          {/* State label */}
          <motion.p
            key={voiceState}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-sm text-muted-foreground mb-5 font-medium"
          >
            {voiceStateLabel()}
          </motion.p>

          {/* Controls row */}
          <div className="flex items-center justify-center gap-6">
            {/* Keyboard switch */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={switchToText}
              className="voice-control-btn w-12 h-12 rounded-full flex items-center justify-center"
            >
              <Keyboard className="w-5 h-5 text-foreground/70" />
            </motion.button>

            {/* Main mic button */}
            <div className="relative">
              {/* Ripple rings when listening */}
              {voiceState === 'listening' && (
                <>
                  <span className="absolute inset-0 rounded-full bg-primary/20 animate-ripple" />
                  <span className="absolute inset-0 rounded-full bg-primary/10 animate-ripple" style={{ animationDelay: '0.6s' }} />
                </>
              )}
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={handleMicPress}
                disabled={voiceState === 'processing' || voiceState === 'ai-responding'}
                className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                  voiceState === 'listening'
                    ? 'mic-listening'
                    : voiceState === 'ai-speaking'
                    ? 'ai-speaking bg-accent/80'
                    : voiceState === 'processing' || voiceState === 'ai-responding'
                    ? 'mic-processing bg-muted'
                    : 'mic-idle bg-primary/90'
                } disabled:cursor-not-allowed`}
              >
                {voiceState === 'listening' ? (
                  <MicOff className="w-7 h-7 text-primary-foreground" />
                ) : voiceState === 'ai-speaking' ? (
                  <Volume2 className="w-7 h-7 text-accent-foreground" />
                ) : (
                  <Mic className="w-7 h-7 text-primary-foreground" />
                )}
              </motion.button>
            </div>

            {/* Replay / next action */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={replayLastResponse}
              disabled={!latestAssistantRef.current}
              className="voice-control-btn w-12 h-12 rounded-full flex items-center justify-center disabled:opacity-30"
              title="Replay last response"
            >
              <ChevronRight className="w-5 h-5 text-foreground/70" />
            </motion.button>
          </div>
        </div>
      ) : (
        /* ═══ TEXT MODE INPUT ═══ */
        <div className="px-4 pb-4 pt-2 relative z-10 border-t border-border/30">
          <div className="glass-card rounded-2xl flex items-end gap-2 p-2">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={switchToVoice}
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-muted/30 text-muted-foreground"
              title="Switch to voice"
            >
              <Mic className="w-4 h-4" />
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
      )}
    </div>
  );
}
