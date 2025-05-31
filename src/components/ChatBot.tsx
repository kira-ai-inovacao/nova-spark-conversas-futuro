import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Zap, Settings, Globe, FileText, Youtube, ArrowLeft, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

type SourceType = 'site' | 'pdf' | 'youtube';

const ChatBot = () => {
  const [messages, setMessages] = useState<Message[]>([{
    id: '1',
    text: 'Olá! Sou o assistente virtual do Polo de Inovação. Primeiro, escolha uma fonte de contexto para que eu possa responder suas perguntas de forma mais precisa.',
    isBot: true,
    timestamp: new Date()
  }]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  
  // Novos estados para gerenciar contexto
  const [contextSet, setContextSet] = useState(false);
  const [selectedSource, setSelectedSource] = useState<SourceType | ''>('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSettingContext, setIsSettingContext] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const API_BASE_URL = 'https://93c01e4e-2963-41d4-9f86-798f7faa0bee-00-35njt8ostge37.kirk.replit.dev';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const setContext = async () => {
    if (!selectedSource) {
      toast({
        title: 'Fonte não selecionada',
        description: 'Por favor, selecione uma fonte de contexto.',
        variant: 'destructive'
      });
      return;
    }

    if (selectedSource === 'pdf' && !selectedFile) {
      toast({
        title: 'Arquivo não selecionado',
        description: 'Por favor, selecione um arquivo PDF.',
        variant: 'destructive'
      });
      return;
    }

    if (selectedSource !== 'pdf' && !sourceUrl.trim()) {
      toast({
        title: 'URL não fornecida',
        description: 'Por favor, forneça a URL.',
        variant: 'destructive'
      });
      return;
    }

    setIsSettingContext(true);
    
    try {
      let response;
      
      if (selectedSource === 'pdf' && selectedFile) {
        // Upload de PDF
        const formData = new FormData();
        formData.append('file', selectedFile);
        
        console.log('Enviando arquivo PDF para /setar_contexto_pdf:', selectedFile.name);
        
        response = await fetch(`${API_BASE_URL}/setar_contexto_pdf`, {
          method: 'POST',
          body: formData
        });
      } else {
        // URL para site ou YouTube
        const payload = {
          tipo: selectedSource,
          caminho: sourceUrl
        };
        
        console.log('Enviando payload para /setar_contexto:', payload);
        
        response = await fetch(`${API_BASE_URL}/setar_contexto`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      }

      console.log('Resposta da API - Status:', response.status);
      console.log('Resposta da API - Headers:', Object.fromEntries(response.headers.entries()));

      let responseData;
      try {
        responseData = await response.json();
        console.log('Resposta da API - Body:', responseData);
      } catch (jsonError) {
        console.error('Erro ao fazer parse do JSON:', jsonError);
        const textResponse = await response.text();
        console.log('Resposta da API - Text:', textResponse);
        throw new Error(`Erro ${response.status}: Resposta inválida do servidor`);
      }

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${responseData?.detail || responseData?.message || 'Erro desconhecido'}`);
      }

      setContextSet(true);
        let extraInfo = '';
        if ((selectedSource === 'pdf' || selectedSource === 'youtube' || selectedSource === 'site') && responseData?.conteudo) {
          extraInfo = `\n\n🧠 Conteúdo inicial:\n${responseData.conteudo}`;
        }
		
	    const contextMessage: Message = {
		  id: Date.now().toString(),
    	  text: `Contexto definido com sucesso! Agora você pode fazer perguntas sobre o conteúdo ${
		    selectedSource === 'site' ? `do site: ${sourceUrl}` : 
		    selectedSource === 'pdf' ? `do PDF: ${selectedFile?.name}` : 
		    `do vídeo do YouTube: ${sourceUrl}`
		  }${extraInfo}`,
		  isBot: true,
		  timestamp: new Date()
	    };
	    setMessages(prev => [...prev, contextMessage]);

      toast({
        title: 'Contexto definido',
        description: 'Agora você pode fazer suas perguntas!'
      });
    } catch (error) {
      console.error('Erro completo:', error);
      
      let errorMessage = 'Não foi possível processar a fonte fornecida.';
      
      if (error instanceof Error) {
        if (error.message.includes('500')) {
          errorMessage = 'Erro interno do servidor. Verifique se a URL/caminho está correto e tente novamente.';
        } else if (error.message.includes('network')) {
          errorMessage = 'Erro de conexão. Verifique sua internet.';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: 'Erro ao definir contexto',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsSettingContext(false);
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim()) return;

    if (!contextSet) {
      toast({
        title: 'Contexto necessário',
        description: 'Por favor, defina primeiro uma fonte de contexto.',
        variant: 'destructive'
      });
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

    const payload = {
      pergunta: inputValue
    };

    console.log('Enviando pergunta para /perguntar:', payload);

    try {
      const response = await fetch(`${API_BASE_URL}/perguntar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      console.log('Resposta /perguntar - Status:', response.status);

      let responseData;
      try {
        responseData = await response.json();
        console.log('Resposta /perguntar - Body:', responseData);
      } catch (jsonError) {
        console.error('Erro ao fazer parse do JSON da pergunta:', jsonError);
        throw new Error('Resposta inválida do servidor');
      }

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${responseData?.detail || responseData?.message || 'Erro na API'}`);
      }

      const botResponse = responseData.resposta || 'Desculpe, não consegui processar sua solicitação.';

      const botMessage: Message = {
        id: Date.now().toString() + '_bot',
        text: botResponse,
        isBot: true,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Erro ao enviar pergunta:', error);
      
      let errorMessage = 'Não foi possível conectar com o serviço.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Erro de conexão',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const resetContext = () => {
    setContextSet(false);
    setSelectedSource('');
    setSourceUrl('');
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setMessages([{
      id: '1',
      text: 'Contexto resetado! Escolha uma nova fonte de contexto para continuar.',
      isBot: true,
      timestamp: new Date()
    }]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast({
          title: 'Arquivo inválido',
          description: 'Por favor, selecione apenas arquivos PDF.',
          variant: 'destructive'
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (contextSet) {
        sendMessage();
      }
    }
  };

  const getSourceIcon = (source: SourceType) => {
    switch (source) {
      case 'site': return <Globe className="w-4 h-4" />;
      case 'pdf': return <FileText className="w-4 h-4" />;
      case 'youtube': return <Youtube className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className="h-screen flex flex-col relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-cyan-900/20"></div>
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-neon-blue/10 rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-purple/10 rounded-full blur-3xl animate-float" style={{animationDelay: '1s'}}></div>

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
              <h1 className="text-xl font-bold bg-gradient-to-r from-neon-blue to-neon-cyan bg-clip-text text-transparent">
                Chat Bot IA Polo Digital de Mogi das Cruzes
              </h1>
              <p className="text-sm text-gray-400">
                Polo de Inovação de Projetos Avançados
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {contextSet && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={resetContext}
                className="text-gray-400 hover:text-white hover:bg-white/10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Mudar Fonte
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowSettings(!showSettings)} 
              className="text-gray-400 hover:text-white hover:bg-white/10"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <Card className="absolute top-20 right-4 w-80 glass-morphism border-white/20 p-4 z-20">
          <h3 className="text-lg font-semibold mb-3 text-white">Configurações</h3>
          <p className="text-sm text-gray-300">
            Este chatbot agora está conectado com a API customizada do Polo de Inovação.
          </p>
        </Card>
      )}

      {/* Context Selection or Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-hide p-4 relative z-10">
        <div className="max-w-4xl mx-auto space-y-4">
          {!contextSet ? (
            /* Context Selection Interface */
            <div className="flex justify-center mt-20">
              <Card className="w-full max-w-md glass-morphism border-white/20 p-6">
                <h3 className="text-xl font-semibold mb-4 text-white text-center">
                  Escolha a Fonte de Contexto
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-300 mb-2 block">Tipo de Fonte</label>
                    <Select value={selectedSource} onValueChange={(value: SourceType) => setSelectedSource(value)}>
                      <SelectTrigger className="bg-gray-800/50 border-gray-600 text-white">
                        <SelectValue placeholder="Selecione uma fonte" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        <SelectItem value="site" className="text-white hover:bg-gray-700">
                          <div className="flex items-center space-x-2">
                            <Globe className="w-4 h-4" />
                            <span>Site/URL</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="pdf" className="text-white hover:bg-gray-700">
                          <div className="flex items-center space-x-2">
                            <FileText className="w-4 h-4" />
                            <span>Upload PDF</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="youtube" className="text-white hover:bg-gray-700">
                          <div className="flex items-center space-x-2">
                            <Youtube className="w-4 h-4" />
                            <span>YouTube</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedSource === 'pdf' ? (
                    <div>
                      <label className="text-sm text-gray-300 mb-2 block">
                        Selecionar Arquivo PDF
                      </label>
                      <div className="space-y-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="application/pdf"
                          onChange={handleFileChange}
                          className="hidden"
                          id="pdf-upload"
                        />
                        <label
                          htmlFor="pdf-upload"
                          className="flex items-center justify-center w-full p-3 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-gray-500 transition-colors"
                        >
                          <div className="flex items-center space-x-2 text-gray-300">
                            <Upload className="w-5 h-5" />
                            <span>
                              {selectedFile ? selectedFile.name : 'Clique para selecionar PDF'}
                            </span>
                          </div>
                        </label>
                        {selectedFile && (
                          <p className="text-xs text-gray-400">
                            Arquivo selecionado: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                          </p>
                        )}
                      </div>
                    </div>
                  ) : selectedSource && (
                    <div>
                      <label className="text-sm text-gray-300 mb-2 block">
                        {selectedSource === 'site' ? 'URL do Site' : 'URL do YouTube'}
                      </label>
                      <Input
                        type="text"
                        value={sourceUrl}
                        onChange={(e) => setSourceUrl(e.target.value)}
                        placeholder={
                          selectedSource === 'site' ? 'https://exemplo.com' :
                          'https://youtube.com/watch?v=...'
                        }
                        className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400"
                      />
                    </div>
                  )}

                  <Button
                    onClick={setContext}
                    disabled={isSettingContext || !selectedSource || 
                      (selectedSource === 'pdf' ? !selectedFile : !sourceUrl.trim())}
                    className="w-full bg-gradient-to-r from-neon-blue to-neon-purple hover:opacity-90"
                  >
                    {isSettingContext ? (
                      <>
                        <Zap className="w-4 h-4 mr-2 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        {selectedSource && getSourceIcon(selectedSource as SourceType)}
                        <span className="ml-2">Definir Contexto</span>
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            </div>
          ) : (
            /* Messages Interface */
            <>
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.isBot ? 'justify-start' : 'justify-end'} animate-fade-in`}>
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
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start animate-fade-in">
                  <div className="max-w-xs lg:max-w-md xl:max-w-lg flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-neon-blue to-neon-purple flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="glass-morphism rounded-2xl p-3 border border-neon-blue/30 bg-blue-900/20">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-neon-blue rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-neon-blue rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                        <div className="w-2 h-2 bg-neon-blue rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input - Only show when context is set */}
      {contextSet && (
        <div className="glass-morphism border-t border-white/10 p-4 relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="flex space-x-3">
              <div className="flex-1 relative">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Digite sua pergunta sobre o contexto definido..."
                  className="glass-morphism border-white/20 text-white placeholder-gray-400 pr-12 py-3 text-base"
                  disabled={isLoading}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Sparkles className="w-4 h-4 text-neon-cyan animate-pulse-neon" />
                </div>
              </div>
              <Button
                onClick={sendMessage}
                disabled={isLoading || !inputValue.trim()}
                className="bg-gradient-to-r from-neon-blue to-neon-purple hover:opacity-90 px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105"
              >
                {isLoading ? <Zap className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBot;
