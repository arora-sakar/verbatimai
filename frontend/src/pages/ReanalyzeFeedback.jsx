import React, { useState } from 'react';
import { useQuery, useMutation } from 'react-query';
import api from '../services/api';

const ReanalyzeFeedback = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [filters, setFilters] = useState({
    sentiment: '',
    source: '',
    dateFrom: null,
    dateTo: null
  });
  const [specificIds, setSpecificIds] = useState('');
  
  // Mutation for re-analyzing feedback
  const reanalyzeMutation = useMutation(
    (data) => api.post('/feedback/reanalyze', data),
    {
      onMutate: () => {
        setIsProcessing(true);
      },
      onSuccess: (response) => {
        setResults(response.data);
        // Display success message
        alert('Feedback re-analysis completed successfully');
      },
      onError: (error) => {
        console.error('Error re-analyzing feedback:', error);
        // Display error message
        alert('Error processing feedback: ' + (error.response?.data?.detail || error.message));
      },
      onSettled: () => {
        setIsProcessing(false);
      }
    }
  );
  
  const handleReanalyze = async () => {
    // Prepare request data
    const requestData = {};
    
    if (specificIds.trim()) {
      // Convert comma-separated IDs to array of numbers
      requestData.specific_ids = specificIds
        .split(',')
        .map(id => id.trim())
        .filter(id => id)
        .map(id => parseInt(id, 10));
    } else {
      // Apply filters
      const filterParams = {};
      if (filters.sentiment) filterParams.sentiment = filters.sentiment;
      if (filters.source) filterParams.source = filters.source;
      if (filters.dateFrom) filterParams.date_from = filters.dateFrom.toISOString();
      if (filters.dateTo) filterParams.date_to = filters.dateTo.toISOString();
      
      requestData.filter_params = filterParams;
    }
    
    // Call the mutation
    reanalyzeMutation.mutate(requestData);
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-lg font-medium mb-4">Re-analyze Feedback Sentiment</h2>
      <p className="text-sm text-gray-600 mb-4">
        This tool allows you to re-process existing feedback using the current sentiment analysis algorithm.
        This is useful after algorithm updates or when you want to incorporate rating data.
      </p>
      
      <div className="mb-6">
        <h3 className="text-md font-medium mb-2">Filter by Properties</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Sentiment</label>
            <select
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              value={filters.sentiment}
              onChange={(e) => setFilters({...filters, sentiment: e.target.value})}
            >
              <option value="">All Sentiments</option>
              <option value="positive">Positive</option>
              <option value="neutral">Neutral</option>
              <option value="negative">Negative</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Source</label>
            <select
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              value={filters.source}
              onChange={(e) => setFilters({...filters, source: e.target.value})}
            >
              <option value="">All Sources</option>
              <option value="CSV Upload">CSV Upload</option>
              <option value="Web Widget">Web Widget</option>
              <option value="Google My Business">Google My Business</option>
              <option value="Manual">Manual Entry</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Date From</label>
            <input
              type="date"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              value={filters.dateFrom ? filters.dateFrom.toISOString().split('T')[0] : ''}
              onChange={(e) => setFilters({...filters, dateFrom: e.target.value ? new Date(e.target.value) : null})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Date To</label>
            <input
              type="date"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              value={filters.dateTo ? filters.dateTo.toISOString().split('T')[0] : ''}
              onChange={(e) => setFilters({...filters, dateTo: e.target.value ? new Date(e.target.value) : null})}
            />
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        <h3 className="text-md font-medium mb-2">Or Process Specific IDs</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700">Feedback IDs (comma-separated)</label>
          <input
            type="text"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            value={specificIds}
            onChange={(e) => setSpecificIds(e.target.value)}
            placeholder="e.g., 123, 456, 789"
          />
        </div>
      </div>
      
      <div className="mt-6">
        <button
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          onClick={handleReanalyze}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : "Re-analyze Feedback"}
        </button>
      </div>
      
      {/* Results */}
      {results && (
        <div className="mt-6 p-4 border rounded-md bg-gray-50">
          <h3 className="font-medium text-md mb-2">Processing Results</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary-600">{results.processed}</div>
              <div className="text-sm text-gray-500">Items Processed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-600">{results.changed}</div>
              <div className="text-sm text-gray-500">Sentiments Changed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-600">{results.total}</div>
              <div className="text-sm text-gray-500">Total Items</div>
            </div>
          </div>
          {results.changed > 0 && (
            <div className="mt-4 text-sm text-gray-700">
              <p>
                <strong>{((results.changed / results.total) * 100).toFixed(1)}%</strong> of feedback items had their sentiment classification updated.
                You may want to review the analytics dashboard to see the updated sentiment distribution.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReanalyzeFeedback;