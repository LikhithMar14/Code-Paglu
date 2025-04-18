import React, { useState, useEffect, useRef } from 'react';
import { useRoomContext, useParticipants } from '@livekit/components-react';

const LiveKitChat = ({ 
  roomId, 
  userName, 
  userAvatar = null, // Default value for missing prop
  onMessageReceived
}) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const room = useRoomContext();
  const participants = useParticipants();

  // Scroll to bottom whenever messages update
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Set up LiveKit data listener
  useEffect(() => {
    if (!room) {
      console.log("Room not available yet");
      return;
    }

    console.log("Setting up data listener for room:", room.name);

    const handleData = (payload, participant, topic) => {
      try {
        const decoder = new TextDecoder();
        const decodedData = decoder.decode(payload);
        const data = JSON.parse(decodedData);
        
        console.log("Data received:", { topic, data });
        
        if (topic === 'chat') {
          // Fix: Use a callback function with prevMessages to ensure we're working with the latest state
          setMessages(prevMessages => {
            // Check if message already exists to prevent duplicates
            const messageExists = prevMessages.some(msg => 
              msg.id === data.id || 
              (msg.content === data.content && 
               msg.user?.name === data.user?.name && 
               msg.timestamp === data.timestamp)
            );
            
            if (messageExists) {
              return prevMessages;
            }
            
            const updatedMessages = [...prevMessages, data];
            console.log("Updated messages state:", updatedMessages);
            return updatedMessages;
          });
          
          // Callback for parent components
          if (onMessageReceived) {
            onMessageReceived(data);
          }
        } else if (topic === 'typing') {
          // Handle typing indicators
          if (data.type === 'typing' && data.user.name !== userName) {
            if (data.isTyping) {
              // Add user to typing list if not already there
              setTypingUsers(prev => {
                if (!prev.includes(data.user.name)) {
                  return [...prev, data.user.name];
                }
                return prev;
              });
            } else {
              // Remove user from typing list
              setTypingUsers(prev => prev.filter(name => name !== data.user.name));
            }
          }
        }
      } catch (err) {
        console.error('Failed to decode message:', err);
      }
    };

    room.on('DataReceived', handleData);

    return () => {
      console.log("Cleaning up data listener");
      room.off('DataReceived', handleData);
    };
  }, [room, onMessageReceived, userName]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || !room || !roomId) {
      console.log("Cannot send message:", { 
        hasInput: !!inputMessage.trim(), 
        hasRoom: !!room, 
        hasRoomId: !!roomId 
      });
      return;
    }
    
    setIsLoading(true);
    
    const userData = {
      name: userName,
      avatar: userAvatar
    };

    try {
      console.log("Sending message:", { room: roomId, message: inputMessage.trim(), user: userData });
      
      // Create message object with unique id
      const messageObj = {
        id: `${userName}-${Date.now()}`,
        content: inputMessage.trim(),
        user: userData,
        sender: 'user',
        messageType: 'text',
        timestamp: Date.now()
      };
      
      // Add message to local state immediately for better UX
      setMessages(prevMessages => [...prevMessages, messageObj]);
      
      // Local message sending through API
      const response = await fetch('/api/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          room: roomId,
          message: inputMessage.trim(),
          user: userData,
          sender: 'user',
          messageType: 'text'
        }),
      });
      
      console.log("Response status:", response.status);
      const responseData = await response.json();
      console.log("Response data:", responseData);

      if (!response.ok) {
        throw new Error(responseData.details || responseData.error || 'Failed to send message');
      }

      console.log("Message sent successfully");
      setInputMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle typing indicator
  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      // Send typing indicator to other participants
      if (room) {
        const typingData = {
          type: 'typing',
          user: { name: userName },
          isTyping: true
        };
        room.localParticipant.publishData(
          new TextEncoder().encode(JSON.stringify(typingData)),
          'typing'
        );
      }
    }

    // Clear previous timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    // Set new timeout
    const timeout = setTimeout(() => {
      setIsTyping(false);
      // Send stopped typing indicator
      if (room) {
        const typingData = {
          type: 'typing',
          user: { name: userName },
          isTyping: false
        };
        room.localParticipant.publishData(
          new TextEncoder().encode(JSON.stringify(typingData)),
          'typing'
        );
      }
    }, 2000);

    setTypingTimeout(timeout);
  };

  // Function to format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Function to get typing indicator text
  const getTypingIndicatorText = () => {
    if (typingUsers.length === 0) return null;
    if (typingUsers.length === 1) return `${typingUsers[0]} is typing...`;
    if (typingUsers.length === 2) return `${typingUsers[0]} and ${typingUsers[1]} are typing...`;
    return `${typingUsers[0]} and ${typingUsers.length - 1} others are typing...`;
  };

  return (
    <div className="flex flex-col h-full rounded-lg overflow-hidden shadow-lg">
      {/* Chat Header */}
      <div className="bg-indigo-600 text-black px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex items-center justify-center h-10 w-10 rounded-full bg-indigo-500 text-white font-bold">
            {roomId.substring(0, 2).toUpperCase()}
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium">Room: {roomId}</h3>
            <p className="text-xs text-indigo-200">{messages.length} messages</p>
          </div>
        </div>
        <div className="flex items-center text-sm">
          <div className="h-3 w-3 bg-green-400 rounded-full mr-2"></div>
          <span>{participants.length} online</span>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div 
              key={msg.id || `${msg.user?.name}-${msg.timestamp}-${index}`} 
              className={`flex ${msg.user?.name === userName ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-xs md:max-w-md rounded-lg px-4 py-2 ${
                  msg.user?.name === userName 
                    ? 'bg-indigo-500 text-white rounded-br-none' 
                    : 'bg-gray-200 text-gray-800 rounded-bl-none'
                }`}
              >
                {msg.user?.name !== userName && (
                  <div className="text-xs font-semibold mb-1">{msg.user?.name}</div>
                )}
                <p className="text-sm">{msg.content}</p>
                <div className="text-xs opacity-70 mt-1 text-right">
                  {formatTime(msg.timestamp)}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator */}
      {typingUsers.length > 0 && (
        <div className="px-4 py-2 text-xs text-gray-500 italic">
          {getTypingIndicatorText()}
        </div>
      )}

      {/* Message Input */}
      <form onSubmit={sendMessage} className="border-t border-gray-200 p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => {
              setInputMessage(e.target.value);
              handleTyping();
            }}
            placeholder="Type your message..."
            className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={isLoading || !room}
          />
          <button
            type="submit"
            disabled={isLoading || !inputMessage.trim() || !room}
            className="bg-indigo-600 text-white rounded-full px-4 py-2 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending
              </span>
            ) : (
              <span className="flex items-center">
                Send
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LiveKitChat;