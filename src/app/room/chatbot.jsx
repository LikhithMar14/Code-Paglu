'use client';

import { useState } from 'react';

export default function ChatBox({ roomName , user}) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState('');

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    setSending(true);
    setStatus('');

    try {
      const res = await fetch('/api/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room: roomName,
          user,
          message,
          topic: 'chat', 
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('Message sent!');
        setMessage('');
      } else {
        setStatus(data.error || 'Error sending message');
      }
    } catch (err) {
      setStatus('Failed to send message');
      console.error(err);
    }

    setSending(false);
  };

  return (
    <div className="p-4 border rounded shadow w-full max-w-md bg-white">
      <h2 className="text-xl font-semibold mb-2">Live Chat</h2>
      <textarea
        className="w-full border rounded p-2 mb-2 resize-none"
        rows={3}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your message..."
        disabled={sending}
      />
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        onClick={handleSendMessage}
        disabled={sending}
      >
        {sending ? 'Sending...' : 'Send'}
      </button>
      {status && <p className="mt-2 text-sm text-gray-600">{status}</p>}
    </div>
  );
}
