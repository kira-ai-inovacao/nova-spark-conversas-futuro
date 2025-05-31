import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Zap, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}
const ChatBot = () => {
  const [messages, setMessages] = useState<Message[]>([{
    id: '1',
    text: 'Olá! Sou o assistente virtual do Polo de Inovação. Como posso ajudá-lo hoje?',
    isBot: true,
    timestamp: new Date()
  }]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [groqApiKey, setGroqApiKey] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const {
    toast
  } = useToast();
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  useEffect(() => {
    const savedKey = localStorage.getItem('groq-api-key');
    if (savedKey) {
      setGroqApiKey(savedKey);
    }
  }, []);
  const saveApiKey = () => {
    if (groqApiKey.trim()) {
      localStorage.setItem('groq-api-key', groqApiKey);
      setShowSettings(false);
      toast({
        title: 'Configuração salva',
        description: 'Chave da API Groq salva com sucesso!'
      });
    }
  };
  const sendMessage = async () => {
    if (!inputValue.trim()) return;
    if (!groqApiKey) {
      toast({
        title: 'Configuração necessária',
        description: 'Por favor, configure sua chave da API Groq nas configurações.',
        variant: 'destructive'
      });
      setShowSettings(true);
      return;
    }
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      isBot: false,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setIsTyping(true);
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama3-8b-8192',
          messages: [{
            role: 'system',
            content: 'Você é um assistente virtual especializado em inovação tecnológica, trabalhando em um polo de inovação. Você ajuda visitantes, empresários, pesquisadores e estudantes com informações sobre projetos, tecnologias emergentes, startups, programas de aceleração, e oportunidades de colaboração. Seja cordial, informativo e mantenha um tom profissional mas acessível.'
          }, ...messages.map(msg => ({
            role: msg.isBot ? 'assistant' : 'user',
            content: msg.text
          })), {
            role: 'user',
            content: inputValue
          }],
          temperature: 0.7,
          max_tokens: 1000
        })
      });
      if (!response.ok) {
        throw new Error('Erro na API Groq');
      }
      const data = await response.json();
      const botResponse = data.choices[0]?.message?.content || 'Desculpe, não consegui processar sua solicitação.';
      const botMessage: Message = {
        id: Date.now().toString() + '_bot',
        text: botResponse,
        isBot: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Erro:', error);
      toast({
        title: 'Erro de conexão',
        description: 'Não foi possível conectar com o serviço. Verifique sua chave da API.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  return <div className="h-screen flex flex-col relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-cyan-900/20"></div>
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-neon-blue/10 rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-purple/10 rounded-full blur-3xl animate-float" style={{
      animationDelay: '1s'
    }}></div>

      {/* Header */}
      <div className="glass-morphism border-b border-white/10 p-4 relative z-10">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-r from-neon-blue to-neon-purple rounded-xl flex items-center justify-center animate-glow">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-neon-cyan rounded-full animate-pulse-neon"></div>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-neon-blue to-neon-cyan bg-clip-text text-transparent">Chat Bot IA Polo Digital de Mogi das Cruzes</h1>
              <p className="text-sm text-gray-400">Polo de Inovação de Projetos Avançados
            </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setShowSettings(!showSettings)} className="text-gray-400 hover:text-white hover:bg-white/10">
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && <Card className="absolute top-20 right-4 w-80 glass-morphism border-white/20 p-4 z-20">
          <h3 className="text-lg font-semibold mb-3 text-white">Configurações</h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-300 mb-2 block">Chave da API Groq</label>
              <Input type="password" value={groqApiKey} onChange={e => setGroqApiKey(e.target.value)} placeholder="gsk_..." className="bg-gray-800/50 border-gray-600 text-white" />
            </div>
            <Button onClick={saveApiKey} className="w-full bg-gradient-to-r from-neon-blue to-neon-purple hover:opacity-90">
              Salvar Configuração
            </Button>
          </div>
        </Card>}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-hide p-4 relative z-10">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map(message => <div key={message.id} className={`flex ${message.isBot ? 'justify-start' : 'justify-end'} animate-fade-in`}>
              <div className={`max-w-xs lg:max-w-md xl:max-w-lg flex items-start space-x-3 ${message.isBot ? '' : 'flex-row-reverse space-x-reverse'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${message.isBot ? 'bg-gradient-to-r from-neon-blue to-neon-purple' : 'bg-gradient-to-r from-neon-cyan to-neon-blue'}`}>
                  {message.isBot ? <Bot className="w-4 h-4 text-white" /> : <User className="w-4 h-4 text-white" />}
                </div>
                <div className={`glass-morphism rounded-2xl p-3 border ${message.isBot ? 'border-neon-blue/30 bg-blue-900/20' : 'border-neon-cyan/30 bg-cyan-900/20'}`}>
                  <p className="text-white text-sm leading-relaxed">{message.text}</p>
                  <span className="text-xs text-gray-400 mt-1 block">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>)}
          
          {isTyping && <div className="flex justify-start animate-fade-in">
              <div className="max-w-xs lg:max-w-md xl:max-w-lg flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-neon-blue to-neon-purple flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="glass-morphism rounded-2xl p-3 border border-neon-blue/30 bg-blue-900/20">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-neon-blue rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-neon-blue rounded-full animate-pulse" style={{
                  animationDelay: '0.2s'
                }}></div>
                    <div className="w-2 h-2 bg-neon-blue rounded-full animate-pulse" style={{
                  animationDelay: '0.4s'
                }}></div>
                  </div>
                </div>
              </div>
            </div>}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="glass-morphism border-t border-white/10 p-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex space-x-3">
            <div className="flex-1 relative">
              <Input value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyPress={handleKeyPress} placeholder="Digite sua mensagem..." className="glass-morphism border-white/20 text-white placeholder-gray-400 pr-12 py-3 text-base" disabled={isLoading} />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Sparkles className="w-4 h-4 text-neon-cyan animate-pulse-neon" />
              </div>
            </div>
            <Button onClick={sendMessage} disabled={isLoading || !inputValue.trim()} className="bg-gradient-to-r from-neon-blue to-neon-purple hover:opacity-90 px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105">
              {isLoading ? <Zap className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>
    </div>;
};
export default ChatBot;