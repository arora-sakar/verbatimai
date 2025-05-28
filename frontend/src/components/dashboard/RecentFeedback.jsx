import { Link } from 'react-router-dom';

const RecentFeedback = ({ items }) => {
  if (!items || items.length === 0) {
    return (
      <div className="text-sm text-gray-500 italic">
        No feedback available yet
      </div>
    );
  }

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
    <div className="space-y-4">
      <ul className="divide-y divide-gray-200">
        {items.map((item) => (
          <li key={item.id} className="py-3">
            <div className="flex items-center justify-between">
              <div className="truncate text-sm font-medium text-gray-800">
                {item.feedback_text.length > 100 
                  ? `${item.feedback_text.substring(0, 100)}...` 
                  : item.feedback_text}
              </div>
              <div className="ml-2">
                {renderSentimentBadge(item.sentiment)}
              </div>
            </div>
            <div className="mt-1 flex items-center text-xs text-gray-500">
              <span>{new Date(item.created_at).toLocaleDateString()}</span>
              <span className="mx-1">&middot;</span>
              <span>{item.source}</span>
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
  );
};

export default RecentFeedback;