import { useQueryClient } from 'react-query';

/**
 * Hook to get access to the QueryClient for cache invalidation
 * @returns {Object} QueryClient instance
 */
export const useQueryInvalidation = () => {
  const queryClient = useQueryClient();
  
  return {
    /**
     * Invalidate dashboard-related queries to force a refresh
     */
    invalidateDashboard: () => {
      console.log('Invalidating dashboard queries...');
      queryClient.invalidateQueries(['analytics']);
      queryClient.invalidateQueries(['recentFeedback']);
      queryClient.invalidateQueries(['sources']);
      queryClient.invalidateQueries(['feedback']);
    },
    
    /**
     * Invalidate all queries for the current user
     */
    invalidateAll: () => {
      console.log('Invalidating all queries...');
      queryClient.invalidateQueries();
    }
  };
};
