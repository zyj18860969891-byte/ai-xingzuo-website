import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './ChatInterface.css';

/**
 * 🌟 星座运势聊天界面
 * 基于ULTIMATE_DEPLOYABLE_PROJECT_GUIDE.md的对话式交互方式
 * 
 * 功能:
 * - 自然语言对话式星座运势查询
 * - 会话管理 (多轮对话)
 * - 实时AI分析和响应
 * - 响应式设计
 * 
 * @author: GitHub Copilot
 * @version: 1.0.0-alpha
 */

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: string;
  metadata?: any;
}

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 初始化会话
  useEffect(() => {
    if (!isInitialized) {
      initializeSession();
      setIsInitialized(true);
    }
  }, [isInitialized]);

  // 聚焦输入框
  useEffect(() => {
    if (inputRef.current && isInitialized) {
      inputRef.current.focus();
    }
  }, [isInitialized]);

  const initializeSession = async () => {
    try {
      const apiBaseUrl = '/api';
      
      const response = await axios.post(`${apiBaseUrl}/horoscope/chat/session`);
      setSessionId(response.data.sessionId);
      
      // 添加欢迎消息
      const welcomeMessage: Message = {
        id: 'welcome',
        type: 'bot',
        content: '🌟 欢迎来到AI星座运势聊天室！\n\n我可以帮你：\n• 查询今日/本周/本月运势\n• 了解星座性格特点\n• 获取爱情、事业、财运分析\n• 星座配对建议\n\n请直接告诉我你的问题，比如：\n"我今天适合做什么？"\n"我的爱情运势如何？"\n"帮我看看本周的事业运"\n\n或者直接输入你的星座：白羊座、金牛座等',
        timestamp: new Date().toLocaleTimeString()
      };
      
      setMessages([welcomeMessage]);
    } catch (error) {
      console.error('初始化会话失败:', error);
      setMessages([{
        id: 'error',
        type: 'bot',
        content: '⚠️ 服务暂时不可用，请稍后再试',
        timestamp: new Date().toLocaleTimeString()
      } as Message]);
    }
  };

  const sendMessage = async (message: string) => {
    if (!message.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const apiBaseUrl = '/api';
      
      const response = await axios.post(`${apiBaseUrl}/horoscope/chat/analyze`, {
        sessionId,
        question: message,
        timestamp: new Date().toISOString()
      });

      // 处理不同类型的响应
      let botMessage: Message;
      
      if (response.data.type === 'zodiac_question') {
        // 星座询问消息
        botMessage = {
          id: (Date.now() + 1).toString(),
          type: 'bot',
          content: response.data.question,
          timestamp: new Date().toLocaleTimeString(),
          metadata: {
            type: 'zodiac_question',
            followUpQuestions: response.data.followUpQuestions,
            aiConfidence: response.data.aiConfidence,
            aiReasoning: response.data.aiReasoning
          }
        };
      } else {
        // 普通回答消息
        botMessage = {
          id: (Date.now() + 1).toString(),
          type: 'bot',
          content: response.data.answer,
          timestamp: new Date().toLocaleTimeString(),
          metadata: response.data.metadata
        };
      }

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: '抱歉，我现在无法处理你的请求。请稍后再试或尝试其他问题。',
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  const handleZodiacSelect = async (zodiacInfo: string, sessionId?: string) => {
    // 从星座信息中提取星座名称
    const zodiacMatch = zodiacInfo.match(/(.+?)\s*\(/);
    const zodiac = zodiacMatch ? zodiacMatch[1] : zodiacInfo;
    
    console.log('用户选择了星座:', zodiac);
    
    try {
      const apiBaseUrl = '/api';
      
      // 首先保存星座信息到会话
      if (sessionId) {
        await axios.post(`${apiBaseUrl}/v1/horoscope/chat/set-zodiac`, {
          sessionId: sessionId,
          zodiac: zodiac
        });
        console.log(`✅ 已保存星座信息: ${zodiac} 到会话: ${sessionId}`);
      }
      
      // 然后发送星座查询请求
      const response = await axios.post(`${apiBaseUrl}/horoscope/chat/analyze`, {
        sessionId: sessionId || 'default-session',
        question: `我的星座是${zodiac}`,
        timestamp: new Date().toISOString()
      });

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: response.data.answer,
        timestamp: new Date().toLocaleTimeString(),
        metadata: response.data.metadata
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('处理星座选择时出错:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: '抱歉，处理您的星座信息时出现了问题。请稍后再试。',
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleSendMessage = () => {
    sendMessage(inputValue);
  };

  const getQuickQuestions = () => [
    '我今天适合做什么？',
    '我的爱情运势如何？',
    '本周事业运怎么样？',
    '财运分析',
    '帮我看看白羊座',
    '星座配对建议'
  ];

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="chat-title">
          <span className="chat-icon">🌟</span>
          <h1 style={{ fontSize: '28px', textAlign: 'center', margin: 0 }}>星座运势聊天小助手</h1>
        </div>
        <div className="session-info">
          {sessionId && <span className="session-id">会话ID: {sessionId.slice(0, 8)}...</span>}
        </div>
      </div>

      <div className="chat-messages" ref={messagesEndRef}>
        {messages.map((message) => (
          <div key={message.id} className={`chat-message ${message.type}`}>
            <div className="message-avatar">
              {message.type === 'user' ? '👤' : '🌟'}
            </div>
            <div className="message-content">
              <div className="message-text">
                {(message.content || '').split('\n').map((line, index) => (
                  <p key={index} style={{ margin: '8px 0' }}>
                    {line}
                  </p>
                ))}
              </div>
              <div className="message-timestamp">{message.timestamp}</div>
              
              {message.metadata && message.metadata.type === 'zodiac_question' && (
                <div className="zodiac-question">
                  <div className="question-hint">💡 请选择您的星座：</div>
                  <div className="follow-up-questions">
                    {(message.metadata.followUpQuestions || []).map((question: string, index: number) => (
                      <button
                        key={index}
                        className="zodiac-option-btn"
                        onClick={() => handleZodiacSelect(question)}
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="chat-message bot">
            <div className="message-avatar">🌟</div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-section">
        <div className="quick-questions">
          {getQuickQuestions().map((question, index) => (
            <button
              key={index}
              className="quick-question-btn"
              onClick={() => sendMessage(question)}
              disabled={isTyping}
            >
              {question}
            </button>
          ))}
        </div>

        <div className="chat-input-container">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入你的星座问题... (例如: 我今天适合做什么？)"
            className="chat-input"
            disabled={!sessionId || isTyping}
            rows={2}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isTyping}
            className="send-btn"
          >
            {isTyping ? '⏳' : '📤'}
          </button>
        </div>

        <div className="input-hint">
          💡 提示: 直接用自然语言提问，我会根据你的星座和问题提供个性化运势分析
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;