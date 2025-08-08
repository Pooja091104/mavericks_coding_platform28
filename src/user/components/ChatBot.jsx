import { useState, useEffect } from 'react';
import { MainContainer, ChatContainer, MessageList, Message, MessageInput } from '@chatscope/chat-ui-kit-react';
import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css';

export default function ChatBot({ user }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load previous messages if user is provided
  useEffect(() => {
    if (user?.uid) {
      // For demo, we'll use localStorage
      const savedMessages = localStorage.getItem(`chat_history_${user.uid}`);
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages));
      }
    }
  }, [user]);

  // Save messages to localStorage for persistence and admin tracking
  const saveMessageToHistory = (userMessage, aiResponse) => {
    if (!user?.uid) return;
    
    // Save to local chat history for admin dashboard
    const timestamp = new Date().toISOString();
    const chatRecord = {
      userId: user.uid,
      userName: user.displayName || user.email,
      userMessage: userMessage,
      aiResponse: aiResponse,
      timestamp: timestamp
    };
    
    // Save to admin chat history
    const adminHistory = JSON.parse(localStorage.getItem('admin_chat_history') || '[]');
    adminHistory.push(chatRecord);
    localStorage.setItem('admin_chat_history', JSON.stringify(adminHistory));
    
    // Also save to user's personal chat history
    localStorage.setItem(`chat_history_${user.uid}`, JSON.stringify(messages));
  };

  const handleSend = async (message) => {
    const newMessage = {
      message,
      direction: 'outgoing',
      sender: 'user'
    };

    const newMessages = [...messages, newMessage];
    setMessages(newMessages);
    setLoading(true);

    try {
      // Generate intelligent response instead of just echoing
      let response = '';
      
      // Simple pattern matching for common questions
      if (message.toLowerCase().includes('hello') || message.toLowerCase().includes('hi')) {
        response = 'Hello! How can I help you today?';
      } else if (message.toLowerCase().includes('help') || message.toLowerCase().includes('doubt')) {
        response = 'I\'m here to help! What specific question do you have about coding or the platform?';
      } else if (message.toLowerCase().includes('code') || message.toLowerCase().includes('programming')) {
        response = 'Programming is a valuable skill! Are you looking for resources, tips, or help with a specific language?';
      } else if (message.toLowerCase().includes('hackathon')) {
        response = 'We have several hackathons planned! You can view them in the Hackathons tab. Is there something specific you\'d like to know?';
      } else if (message.toLowerCase().includes('resume')) {
        response = 'You can upload and manage your resume in the Resume Builder section. Would you like tips on creating an effective tech resume?';
      } else {
        response = 'Thank you for your question. I\'m here to help with coding questions, platform navigation, or learning resources. Could you provide more details about what you\'re looking for?';
      }
      
      const botMessage = {
        message: response,
        direction: 'incoming',
        sender: 'AI Assistant'
      };
      
      setMessages([...newMessages, botMessage]);
      
      // Save interaction for admin tracking
      saveMessageToHistory(message, response);
    } catch (error) {
      console.error(error);
      const errorMessage = {
        message: 'Sorry, I encountered an error processing your request.',
        direction: 'incoming',
        sender: 'AI Assistant'
      };
      setMessages([...newMessages, errorMessage]);
      
      // Save error interaction
      saveMessageToHistory(message, 'Error processing request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[500px] w-full rounded-lg overflow-hidden shadow-lg">
      <MainContainer>
        <ChatContainer>
          <MessageList>
            {messages.map((message, i) => (
              <Message key={i} model={message} />
            ))}
          </MessageList>
          <MessageInput placeholder="Type message here" onSend={handleSend} />
        </ChatContainer>
      </MainContainer>
    </div>
  );
}