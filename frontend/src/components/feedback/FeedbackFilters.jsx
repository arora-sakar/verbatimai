import { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import api from '../../services/api';

const FeedbackFilters = ({ filters, onFilterChange }) => {
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  
  // Fetch sources for dropdown
  const { data: sources } = useQuery(
    'sources',
    async () => {
      const response = await api.get('/analytics/sources');
      return response.data;
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      placeholderData: [], // Default to empty array while loading
    }
  );

  // Debounce search term changes
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTerm !== filters.search) {
        onFilterChange({ search: searchTerm });
      }
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, filters.search, onFilterChange]);

  const handleSentimentChange = (sentiment) => {
    onFilterChange({ 
      sentiment: filters.sentiment === sentiment ? '' : sentiment 
    });
  };

  const handleSourceChange = (e) => {
    onFilterChange({ source: e.target.value });
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    onFilterChange({ sentiment: '', source: '', search: '' });
  };

  const isFiltersActive = filters.sentiment || filters.source || filters.search;

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
      {/* Search */}
      <div>
        <label htmlFor="search" className="block text-sm font-medium text-gray-700">
          Search
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <input
            type="text"
            id="search"
            className="focus:ring-primary-500 focus:border-primary-500 block w-full pr-10 sm:text-sm border-gray-300 rounded-md"
            placeholder="Search in feedback text..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
        {/* Sentiment Filter */}
        <div className="sm:w-1/2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sentiment
          </label>
          <div className="flex space-x-2">
            <button
              className={`px-3 py-1 rounded-full text-sm ${
                filters.sentiment === 'positive'
                  ? 'bg-green-100 text-green-800 font-medium'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => handleSentimentChange('positive')}
            >
              Positive
            </button>
            <button
              className={`px-3 py-1 rounded-full text-sm ${
                filters.sentiment === 'neutral'
                  ? 'bg-yellow-100 text-yellow-800 font-medium'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => handleSentimentChange('neutral')}
            >
              Neutral
            </button>
            <button
              className={`px-3 py-1 rounded-full text-sm ${
                filters.sentiment === 'negative'
                  ? 'bg-red-100 text-red-800 font-medium'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => handleSentimentChange('negative')}
            >
              Negative
            </button>
          </div>
        </div>

        {/* Source Filter */}
        <div className="sm:w-1/2">
          <label htmlFor="source" className="block text-sm font-medium text-gray-700">
            Source
          </label>
          <select
            id="source"
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
            value={filters.source}
            onChange={handleSourceChange}
          >
            <option value="">All Sources</option>
            {sources && sources.map((item, index) => (
              <option key={index} value={item.source}>
                {item.source} ({item.count})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Clear Filters */}
      {isFiltersActive && (
        <div className="flex justify-end">
          <button
            onClick={handleClearFilters}
            className="text-sm text-primary-600 hover:text-primary-500"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
};

export default FeedbackFilters;