import { useState } from 'react';
import FeedbackDetailModal from './FeedbackDetailModal';

const FeedbackItem = ({ item }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  // Render topic chips (limited to first 3 in list view)
  const renderTopics = (topics) => {
    if (!topics || topics.length === 0) return null;
    
    const displayTopics = topics.slice(0, 3);
    const hasMore = topics.length > 3;
    
    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {displayTopics.map((topic, index) => (
          <span 
            key={index} 
            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
          >
            {topic}
          </span>
        ))}
        {hasMore && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-600">
            +{topics.length - 3} more
          </span>
        )}
      </div>
    );
  };

  // Truncate text for list view
  const truncateText = (text, maxLength = 120) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <>
      <li 
        className="px-4 py-4 hover:bg-gray-50 cursor-pointer transition-colors duration-150 border-b border-gray-100 last:border-b-0"
        onClick={() => setIsModalOpen(true)}
        title="Click to view full feedback details"
      >
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1 pr-4">
            <p className="text-sm font-medium text-gray-900 leading-relaxed">
              {truncateText(item.feedback_text, 150)}
            </p>
            {renderTopics(item.topics)}
          </div>
          <div className="ml-4 flex-shrink-0 flex items-center space-x-2">
            {renderSentimentBadge(item.sentiment)}
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
        <div className="mt-3 flex justify-between items-center text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              <span>{formatDate(item.created_at)}</span>
            </div>
            <div className="flex items-center">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
              </svg>
              <span>{item.source}</span>
            </div>
            {item.customer_name && (
              <div className="flex items-center">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                <span>{item.customer_name}</span>
              </div>
            )}
          </div>
          {item.rating && (
            <div className="flex items-center">
              <svg className="w-3 h-3 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="font-medium">{item.rating}/5</span>
            </div>
          )}
        </div>
      </li>

      {/* Feedback Detail Modal */}
      <FeedbackDetailModal 
        feedback={item}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

export default FeedbackItem;