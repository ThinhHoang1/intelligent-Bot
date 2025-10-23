
import React from 'react';
import { ChatMessage } from '../types';
import CSVTable from './CSVTable';
import ChartDisplay from './ChartDisplay';
import MarkdownRenderer from './MarkdownRenderer';

interface MessageProps {
  message: ChatMessage;
}

const Message: React.FC<MessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const messageBg = isUser ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800';
  const messageAlignment = isUser ? 'self-end' : 'self-start';
  const cornerRadius = isUser ? 'rounded-br-none' : 'rounded-bl-none';

  return (
    <div className={`flex flex-col max-w-2xl ${messageAlignment} mb-4`}>
      <div
        className={`px-4 py-2 rounded-lg shadow-md ${messageBg} ${cornerRadius} transition-colors duration-200`}
      >
        <div className="text-xs font-semibold mb-1 opacity-80">
          {isUser ? 'You' : 'Gemini'} @ {message.timestamp}
        </div>
        {message.imageUrl && (
          <div className="my-2">
            <img src={message.imageUrl} alt="Uploaded" className="max-w-xs md:max-w-sm lg:max-w-md h-auto rounded-md shadow-sm border border-gray-300" />
          </div>
        )}
        {message.text && (
          <div className={`${isUser ? 'text-white' : 'text-gray-800'}`}>
            <MarkdownRenderer content={message.text} />
          </div>
        )}
        {message.csvTableData && (
          <div className="mt-2">
            <CSVTable data={message.csvTableData} />
          </div>
        )}
        {message.chartData && (
          <div className="mt-2">
            <ChartDisplay chartData={message.chartData} />
          </div>
        )}
        {message.groundingUrls && message.groundingUrls.length > 0 && (
          <div className="mt-2 text-xs opacity-90">
            <p className="font-semibold mb-1">Sources:</p>
            <ul className="list-disc list-inside space-y-1">
              {message.groundingUrls.map((url, index) => (
                <li key={index}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-200 hover:text-blue-100 underline"
                  >
                    {url}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
        {message.isLoading && (
          <div className="flex items-center space-x-2 mt-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Message;