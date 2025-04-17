import React, { useState } from 'react';
import { MonacoEditor } from './monacoEditor';
import { VideoMeet } from './video-meet';

const Sidebar = () => {
  const [activeTab, setActiveTab] = useState('editor');

  const renderContent = () => {
    switch (activeTab) {
      case 'editor':
        return <MonacoEditor />;
      case 'video':
        return <VideoMeet />;
      case 'chat':
        return <div className="p-4">Chat component will be implemented here</div>;
      default:
        return <MonacoEditor />;
    }
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 text-white p-4">
        <h2 className="text-xl font-bold mb-6">Options</h2>
        <nav>
          <ul className="space-y-4">
            <li>
              <button
                className={`w-full text-left p-2 rounded ${
                  activeTab === 'editor' ? 'bg-blue-600' : 'hover:bg-gray-700'
                }`}
                onClick={() => setActiveTab('editor')}
              >
                Editor
              </button>
            </li>
            <li>
              <button
                className={`w-full text-left p-2 rounded ${
                  activeTab === 'video' ? 'bg-blue-600' : 'hover:bg-gray-700'
                }`}
                onClick={() => setActiveTab('video')}
              >
                Video
              </button>
            </li>
            <li>
              <button
                className={`w-full text-left p-2 rounded ${
                  activeTab === 'chat' ? 'bg-blue-600' : 'hover:bg-gray-700'
                }`}
                onClick={() => setActiveTab('chat')}
              >
                Chat
              </button>
            </li>
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {renderContent()}
      </div>
    </div>
  );
};

export default Sidebar; 