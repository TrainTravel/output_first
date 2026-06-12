import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Send, MessageCircle, Sprout, Layers } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { ThoughtContext } from '@/types/chat';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatScreenProps {
  onBack: () => void;
  context?: ThoughtContext | null;
}

function getChatUrl() {
  const base = import.meta.env.VITE_SUPABASE_URL;
  return `${base}/functions/v1/language-chat`;
}

export function ChatScreen({ onBack, context }: ChatScreenProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { targetLang, primaryLang, knownLangs } = useLanguage();
  const isFr = targetLang === 'fr';
  const isEs = targetLang === 'es';
  const isZh = targetLang === 'zh-Hans' || targetLang === 'zh-Hant';
  const zhVariant: 'Hans' | 'Hant' | null =
    targetLang === 'zh-Hans' ? 'Hans' : targetLang === 'zh-Hant' ? 'Hant' : null;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-start conversation when context is provided
  useEffect(() => {
    if (context && context.thoughts.length > 0 && !hasStarted) {
      startConversation();
    }
  }, [context]);

  const startConversation = async () => {
    setHasStarted(true);
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const chatUrl = getChatUrl();
      const bodyPayload: Record<string, unknown> = {
        messages: [],
        thoughtContext: context,
        targetLang,
        lang: targetLang, // legacy field, kept for forward-compat with older deployments
        primaryLang,
        knownLangs,
      };
      if (isZh) bodyPayload.variant = zhVariant;

      const resp = await fetch(chatUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify(bodyPayload),
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        const errorMsg = errorData.code
          ? `${errorData.error || 'Failed'} (${errorData.code})`
          : errorData.error || 'Failed to start conversation';
        throw new Error(errorMsg);
      }

      await streamResponse(resp, []);
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast({
        variant: 'destructive',
        title: isFr ? 'Erreur de connexion' : isEs ? 'Error de conexión' : 'Connection error',
        description: error instanceof Error ? error.message : 'Could not connect to chat',
      });
      setHasStarted(false);
    } finally {
      setIsLoading(false);
    }
  };

  const streamResponse = async (resp: Response, currentMessages: Message[]) => {
    if (!resp.body) return;

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = '';
    let assistantContent = '';

    setMessages([...currentMessages, { role: 'assistant', content: '' }]);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (line.startsWith(':') || line.trim() === '') continue;
        if (!line.startsWith('data: ')) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') break;

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantContent += content;
            setMessages((prev) => {
              const newMessages = [...prev];
              newMessages[newMessages.length - 1] = {
                role: 'assistant',
                content: assistantContent,
              };
              return newMessages;
            });
          }
        } catch {
          textBuffer = line + '\n' + textBuffer;
          break;
        }
      }
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const chatUrl = getChatUrl();
      const bodyPayload2: Record<string, unknown> = {
        messages: newMessages,
        thoughtContext: context,
        targetLang,
        lang: targetLang, // legacy field, kept for forward-compat with older deployments
        primaryLang,
        knownLangs,
      };
      if (isZh) bodyPayload2.variant = zhVariant;

      const resp = await fetch(chatUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify(bodyPayload2),
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        const errorMsg = errorData.code
          ? `${errorData.error || 'Failed'} (${errorData.code})`
          : errorData.error || 'Failed to send message';
        throw new Error(errorMsg);
      }

      await streamResponse(resp, newMessages);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        variant: 'destructive',
        title: isFr ? 'Erreur' : isEs ? 'Error' : 'Error',
        description: error instanceof Error ? error.message : 'Could not send message',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="p-4 border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <MessageCircle className="h-5 w-5 text-primary flex-shrink-0" />
            <h1 className="text-xl font-medium truncate">
              {context ? context.label : (isFr ? 'Conversation' : isEs ? 'Conversación' : 'Conversation')}
            </h1>
          </div>
          {context && (
            <div className="flex items-center gap-1.5 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full flex-shrink-0">
              {context.mode === 'all' && <Sprout className="w-3 h-3" />}
              {context.mode === 'theme' && <Sprout className="w-3 h-3" />}
              {context.mode === 'cluster' && <Layers className="w-3 h-3" />}
              <span>{context.thoughts.length}</span>
            </div>
          )}
        </div>
      </header>

      {/* Messages area */}
      <main className="flex-1 overflow-y-auto p-4">
        <div className="max-w-2xl mx-auto space-y-4">
          {!hasStarted ? (
            <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <MessageCircle className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl mb-3">
                {context
                  ? (isFr ? 'Explorer vos pensées' : isEs ? 'Explorar tus pensamientos' : 'Explore Your Thoughts')
                  : (isFr ? 'Practice French Conversation' : isEs ? 'Practica la conversación en francés' : 'Practice French Conversation')}
              </h2>
              <p className="text-muted-foreground mb-8 max-w-md">
                {context
                  ? (isFr
                    ? "Discutons ensemble de vos pensées. L'IA utilisera des techniques de TCC pour vous aider à explorer vos schémas de pensée avec curiosité et bienveillance."
                    : isEs
                    ? 'Hablemos de tus pensamientos. La IA usará técnicas de TCC para ayudarte a explorar tus patrones de pensamiento con curiosidad y compasión.'
                    : 'Let\'s discuss your thoughts together. The AI will use CBT techniques to help you explore your thinking patterns with curiosity and compassion.')
                  : (isFr
                    ? 'Chat with a supportive AI partner who helps you express yourself in French while building emotional awareness.'
                    : isEs
                    ? 'Chatea con un compañero IA que te ayuda a expresarte en francés y desarrollar conciencia emocional.'
                    : 'Chat with a supportive AI partner who helps you express yourself in French while building emotional awareness.')}
              </p>
              <Button onClick={startConversation} size="lg" className="gap-2">
                <MessageCircle className="h-5 w-5" />
                {context
                  ? (isFr ? 'Commencer l\'exploration' : isEs ? 'Comenzar exploración' : 'Start Exploring')
                  : (isFr ? 'Start Conversation' : isEs ? 'Comenzar conversación' : 'Start Conversation')}
              </Button>
            </div>
          ) : (
            <>
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-card border border-border rounded-bl-md'
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && messages[messages.length - 1]?.role === 'user' && (
                <div className="flex justify-start animate-fade-in">
                  <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-gentle-pulse" />
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-gentle-pulse" style={{ animationDelay: '0.2s' }} />
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-gentle-pulse" style={{ animationDelay: '0.4s' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </main>

      {/* Input area */}
      {hasStarted && (
        <footer className="border-t border-border bg-card/50 backdrop-blur-sm p-4">
          <div className="max-w-2xl mx-auto flex gap-3">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isFr ? 'Write in French...' : isEs ? 'Escribe en francés...' : 'Write in French...'}
              className="resize-none min-h-[48px] max-h-32"
              rows={1}
              disabled={isLoading}
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="shrink-0 h-12 w-12"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </footer>
      )}
    </div>
  );
}
