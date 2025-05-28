import { useState } from 'react';

const FeedbackItem = ({ item }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Render sentiment badge
  const renderSentimentBadge = (sentiment) => {
    if (!sentiment) return null;
    
    const badgeClasses = {
      positive: 'bg-green-100 text-green-800',
      negative: 'bg-red-100 text-red-800',
      neutral: 'bg-yellow-100 text-yellow-800',
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClasses[sentiment] || ''}`}>
        {sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}
      </span>
    );
  };

  // Render topic chips
  const renderTopics = (topics) => {
    if (!topics || topics.length === 0) return null;
    
    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {topics.map((topic, index) => (
          <span 
            key={index} 
            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
          >
            {topic}
          </span>
        ))}
      </div>
    );
  };

  return (
    <li className="px-4 py-4 hover:bg-gray-50 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-medium text-gray-900 ${isExpanded ? '' : 'line-clamp-2'}`}>
            {item.feedback_text}
          </p>
          {renderTopics(item.topics)}
        </div>
        <div className="ml-4 flex-shrink-0 flex items-center">
          {renderSentimentBadge(item.sentiment)}
        </div>
      </div>
      <div className="mt-2 flex justify-between text-xs text-gray-500">
        <div className="flex items-center">
          <span>{formatDate(item.created_at)}</span>
          <span className="mx-1">&middot;</span>
          <span>{item.source}</span>
        </div>
        {item.rating && (
          <div className="flex items-center">
            <span className="text-yellow-400 mr-1">★</span>
            <span>{item.rating}</span>
          </div>
        )}
      </div>
    </li>
  );
};

export default FeedbackItem;