import Modal from '../common/Modal';

const FeedbackDetailModal = ({ feedback, isOpen, onClose }) => {
  if (!feedback) return null;

  // Format date with more detail
  const formatDate = (dateString) => {
    const options = { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Render sentiment badge with icon
  const renderSentimentBadge = (sentiment) => {
    if (!sentiment) return null;
    
    const sentimentConfig = {
      positive: {
        classes: 'bg-green-100 text-green-800 border-green-200',
        icon: '😊',
        label: 'Positive'
      },
      negative: {
        classes: 'bg-red-100 text-red-800 border-red-200',
        icon: '😞',
        label: 'Negative'
      },
      neutral: {
        classes: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: '😐',
        label: 'Neutral'
      }
    };

    const config = sentimentConfig[sentiment] || sentimentConfig.neutral;
    
    return (
      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${config.classes}`}>
        <span className="mr-2">{config.icon}</span>
        {config.label}
      </div>
    );
  };

  // Render star rating
  const renderStarRating = (rating) => {
    if (!rating) return null;
    
    return (
      <div className="flex items-center space-x-1">
        <span className="text-sm font-medium text-gray-700">Rating:</span>
        <div className="flex items-center">
          {[1, 2, 3, 4, 5].map((star) => (
            <svg
              key={star}
              className={`w-4 h-4 ${
                star <= rating ? 'text-yellow-400' : 'text-gray-300'
              }`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
          <span className="ml-2 text-sm font-medium text-gray-900">{rating}/5</span>
        </div>
      </div>
    );
  };

  // Render topic chips
  const renderTopics = (topics) => {
    if (!topics || topics.length === 0) {
      return (
        <span className="text-sm text-gray-500 italic">No topics identified</span>
      );
    }
    
    return (
      <div className="flex flex-wrap gap-2">
        {topics.map((topic, index) => (
          <span 
            key={index} 
            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200"
          >
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            {topic}
          </span>
        ))}
      </div>
    );
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Feedback Details" 
      size="large"
    >
      <div className="space-y-6">
        {/* Feedback Text */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Feedback</h4>
          <div className="bg-gray-50 rounded-lg p-4 border">
            <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">
              {feedback.feedback_text}
            </p>
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            {/* Sentiment */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Sentiment Analysis</h4>
              {renderSentimentBadge(feedback.sentiment)}
            </div>

            {/* Rating */}
            {feedback.rating && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Customer Rating</h4>
                {renderStarRating(feedback.rating)}
              </div>
            )}

            {/* Source */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Source</h4>
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 border border-gray-200">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                </svg>
                {feedback.source}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Date */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Received Date</h4>
              <p className="text-sm text-gray-900">{formatDate(feedback.created_at)}</p>
            </div>

            {/* Customer Info */}
            {(feedback.customer_name || feedback.customer_email) && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Customer Information</h4>
                <div className="space-y-1">
                  {feedback.customer_name && (
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">Name:</span> {feedback.customer_name}
                    </p>
                  )}
                  {feedback.customer_email && (
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">Email:</span> {feedback.customer_email}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Feedback ID */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Feedback ID</h4>
              <p className="text-xs text-gray-500 font-mono">#{feedback.id}</p>
            </div>
          </div>
        </div>

        {/* Topics */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Identified Topics</h4>
          {renderTopics(feedback.topics)}
        </div>

        {/* Actions */}
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default FeedbackDetailModal;