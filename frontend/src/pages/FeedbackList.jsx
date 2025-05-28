import { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import api from '../services/api';

// Components
import FeedbackFilters from '../components/feedback/FeedbackFilters';
import FeedbackItem from '../components/feedback/FeedbackItem';
import Pagination from '../components/common/Pagination';

const FeedbackList = () => {
  // State for filters and pagination
  const [filters, setFilters] = useState({
    sentiment: '',
    source: '',
    search: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  // Fetch feedback data with filters
  const { data: feedbackItems, isLoading, refetch } = useQuery(
    ['feedback', filters, currentPage],
    async () => {
      const params = {
        ...filters,
        skip: (currentPage - 1) * itemsPerPage,
        limit: itemsPerPage,
      };
      
      const response = await api.get('/feedback/', { params });
      // In a real implementation, we would get total count from headers or response
      // For now, we'll simulate it
      setTotalItems(response.data.length > 0 ? 50 : 0); // Just a placeholder
      return response.data;
    },
    {
      keepPreviousData: true,
    }
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Handle pagination
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Feedback List</h1>
      </div>

      {/* Filters */}
      <FeedbackFilters 
        filters={filters} 
        onFilterChange={handleFilterChange} 
      />

      {/* Results */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : feedbackItems && feedbackItems.length > 0 ? (
          <div>
            <ul className="divide-y divide-gray-200">
              {feedbackItems.map((item) => (
                <FeedbackItem key={item.id} item={item} />
              ))}
            </ul>
            
            {/* Pagination */}
            <div className="px-4 py-3 border-t border-gray-200">
              <Pagination 
                currentPage={currentPage}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
              />
            </div>
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-gray-500">No feedback found with the current filters.</p>
            {(filters.sentiment || filters.source || filters.search) && (
              <button
                onClick={() => setFilters({ sentiment: '', source: '', search: '' })}
                className="mt-2 text-sm text-primary-600 hover:text-primary-500"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackList;