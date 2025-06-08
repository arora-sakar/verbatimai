import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { useNavigate } from 'react-router-dom';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const TopTopics = ({ positiveTopics, negativeTopics }) => {
  const navigate = useNavigate();
  // Ensure topics are valid arrays
  const validPositiveTopics = Array.isArray(positiveTopics) ? positiveTopics : [];
  const validNegativeTopics = Array.isArray(negativeTopics) ? negativeTopics : [];
  
  // Handle empty data
  if (!validPositiveTopics.length && !validNegativeTopics.length) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No topics found in feedback
      </div>
    );
  }

  // Handle topic click - navigate to feedback list with filters
  const handleTopicClick = (topicName, sentiment) => {
    const params = new URLSearchParams();
    params.set('topic', topicName);
    params.set('sentiment', sentiment);
    navigate(`/feedback?${params.toString()}`);
  };

  const renderTopicList = (topics, type) => {
    const color = type === 'positive' ? 'text-green-600' : 'text-red-600';
    const bgColor = type === 'positive' ? 'bg-green-50' : 'bg-red-50';
    const borderColor = type === 'positive' ? 'border-green-200' : 'border-red-200';
    
    return (
      <div>
        <h3 className={`text-sm font-medium ${color} mb-2`}>
          {type === 'positive' ? 'Top Positive Topics' : 'Top Negative Topics'}
        </h3>
        {topics && topics.length > 0 ? (
          <ul className="space-y-2">
            {topics.map((topic, index) => (
              <li 
                key={index} 
                className={`flex justify-between px-3 py-2 rounded-md border ${borderColor} ${bgColor} cursor-pointer hover:shadow-md transition-all duration-200 group`}
                onClick={() => handleTopicClick(topic.topic, type)}
                title={`Click to view all ${type} feedback about "${topic.topic}"`}
              >
                <span className="text-sm truncate group-hover:text-gray-900 transition-colors">{topic.topic}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{topic.count}</span>
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500 italic">No {type} topics found</p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {renderTopicList(validPositiveTopics, 'positive')}
      {renderTopicList(validNegativeTopics, 'negative')}
    </div>
  );
};

export default TopTopics;