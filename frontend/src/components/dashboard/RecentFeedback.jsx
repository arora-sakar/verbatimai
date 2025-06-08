import { Link } from 'react-router-dom';
import { useState } from 'react';
import FeedbackDetailModal from '../feedback/FeedbackDetailModal';

const RecentFeedback = ({ items }) => {
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Guard against empty or undefined items
  if (!items || !Array.isArray(items) || items.length === 0) {
    return (
      <div className="text-sm text-gray-500 italic">
        No feedback available yet
      </div>
    );
  }

  // Handle feedback item click
  const handleFeedbackClick = (feedback) => {
    setSelectedFeedback(feedback);
    setIsModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedFeedback(null);
  };

  // Function to render sentiment badge
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

  return (
    <>
      <div className="space-y-4">
        <ul className="divide-y divide-gray-200">
          {items.map((item) => (
            <li 
              key={item.id} 
              className="py-3 cursor-pointer hover:bg-gray-50 rounded-lg px-3 transition-colors duration-150"
              onClick={() => handleFeedbackClick(item)}
              title="Click to view full feedback details"
            >
              <div className="flex items-center justify-between">
                <div className="truncate text-sm font-medium text-gray-800 pr-4">
                  {item && item.feedback_text ? (
                    item.feedback_text.length > 100 
                      ? `${item.feedback_text.substring(0, 100)}...` 
                      : item.feedback_text
                  ) : (
                    "No feedback text available"
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {renderSentimentBadge(item.sentiment)}
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
              <div className="mt-1 flex items-center text-xs text-gray-500">
                <div className="flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  <span>{item && item.created_at ? new Date(item.created_at).toLocaleDateString() : 'No date'}</span>
                </div>
                <span className="mx-2">&middot;</span>
                <div className="flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                  </svg>
                  <span>{item && item.source ? item.source : 'Unknown source'}</span>
                </div>
                {item.rating && (
                  <>
                    <span className="mx-2">&middot;</span>
                    <div className="flex items-center">
                      <svg className="w-3 h-3 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="font-medium">{item.rating}/5</span>
                    </div>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
        <div className="text-right">
          <Link 
            to="/feedback" 
            className="text-sm font-medium text-primary-600 hover:text-primary-500"
          >
            View all feedback
          </Link>
        </div>
      </div>

      {/* Feedback Detail Modal */}
      <FeedbackDetailModal 
        feedback={selectedFeedback}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </>
  );
};

export default RecentFeedback;