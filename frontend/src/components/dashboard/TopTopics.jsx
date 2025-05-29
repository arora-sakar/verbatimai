import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const TopTopics = ({ positiveTopics, negativeTopics }) => {
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
                className={`flex justify-between px-3 py-2 rounded-md border ${borderColor} ${bgColor}`}
              >
                <span className="text-sm truncate">{topic.topic}</span>
                <span className="text-sm font-medium">{topic.count}</span>
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