import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useMutation } from 'react-query';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useQueryInvalidation } from '../hooks/useQueryInvalidation';
import UniversalReviewUploader from '../components/feedback/UniversalReviewUploader';

const UploadFeedback = () => {
  const navigate = useNavigate();
  const { invalidateDashboard } = useQueryInvalidation();
  
  const [activeTab, setActiveTab] = useState('universal');
  
  const [uploadStatus, setUploadStatus] = useState({
    status: null,
    message: '',
    details: null,
  });
  
  const [singleFeedback, setSingleFeedback] = useState({
    feedback_text: '',
    source: 'Manual Entry',
    rating: '',
  });

  // CSV upload mutation
  const csvUploadMutation = useMutation(
    async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      return api.post('/feedback/upload-csv', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
    {
      onSuccess: (data) => {
        setUploadStatus({
          status: 'success',
          message: 'CSV uploaded successfully!',
          details: data.data,
        });
        
        invalidateDashboard();
        
        setTimeout(() => {
          if (confirm('CSV uploaded successfully! Would you like to view the dashboard now?')) {
            navigate('/dashboard');
          }
        }, 500);
      },
      onError: (error) => {
        setUploadStatus({
          status: 'error',
          message: 'Failed to upload CSV',
          details: error.response?.data?.detail || error.message,
        });
      },
    }
  );

  // Single feedback mutation
  const feedbackMutation = useMutation(
    async (feedbackData) => {
      return api.post('/feedback/', feedbackData);
    },
    {
      onSuccess: () => {
        setUploadStatus({
          status: 'success',
          message: 'Feedback submitted successfully!',
        });
        setSingleFeedback({
          feedback_text: '',
          source: 'Manual Entry',
          rating: '',
        });
        
        invalidateDashboard();
      },
      onError: (error) => {
        setUploadStatus({
          status: 'error',
          message: 'Failed to submit feedback',
          details: error.response?.data?.detail || error.message,
        });
      },
    }
  );

  // Dropzone configuration
  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    accept: {
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
    onDrop: (accepted) => {
      if (accepted.length > 0) {
        handleCsvUpload(accepted[0]);
      }
    },
  });

  const handleCsvUpload = (file) => {
    setUploadStatus({
      status: 'loading',
      message: 'Uploading CSV...',
    });
    csvUploadMutation.mutate(file);
  };

  const handleSingleFeedbackSubmit = (e) => {
    e.preventDefault();
    
    if (!singleFeedback.feedback_text.trim()) {
      setUploadStatus({
        status: 'error',
        message: 'Feedback text is required',
      });
      return;
    }
    
    setUploadStatus({
      status: 'loading',
      message: 'Submitting feedback...',
    });
    
    const data = {
      ...singleFeedback,
      rating: singleFeedback.rating ? parseInt(singleFeedback.rating, 10) : null,
    };
    
    feedbackMutation.mutate(data);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSingleFeedback((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const StatusMessage = () => {
    if (!uploadStatus.status) return null;
    
    return (
      <div 
        className={`p-4 rounded-md mb-6 ${
          uploadStatus.status === 'success' 
            ? 'bg-green-50 border-green-200' 
            : uploadStatus.status === 'error'
            ? 'bg-red-50 border-red-200'
            : 'bg-blue-50 border-blue-200'
        }`}
      >
        <div className="flex">
          <div className="flex-shrink-0">
            {uploadStatus.status === 'success' && (
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
            {uploadStatus.status === 'error' && (
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            {uploadStatus.status === 'loading' && (
              <svg className="animate-spin h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
          </div>
          <div className="ml-3 flex-1">
            <p className={`text-sm font-medium ${
              uploadStatus.status === 'success' 
                ? 'text-green-800' 
                : uploadStatus.status === 'error'
                ? 'text-red-800'
                : 'text-blue-800'
            }`}>
              {uploadStatus.message}
            </p>
            {uploadStatus.details && (
              <div className="mt-2 text-sm">
                {typeof uploadStatus.details === 'string' ? (
                  <p>{uploadStatus.details}</p>
                ) : (
                  <ul className="list-disc pl-5 space-y-1">
                    {uploadStatus.details.created && (
                      <li>Created: {uploadStatus.details.created}</li>
                    )}
                    {uploadStatus.details.failed && (
                      <li>Failed: {uploadStatus.details.failed}</li>
                    )}
                    {uploadStatus.details.total && (
                      <li>Total: {uploadStatus.details.total}</li>
                    )}
                  </ul>
                )}
              </div>
            )}
          </div>
          <div className="ml-auto pl-3">
            <button
              onClick={() => setUploadStatus({ status: null, message: '', details: null })}
              className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                uploadStatus.status === 'success' 
                  ? 'bg-green-50 text-green-500 hover:bg-green-100 focus:ring-green-600' 
                  : uploadStatus.status === 'error'
                  ? 'bg-red-50 text-red-500 hover:bg-red-100 focus:ring-red-600'
                  : 'bg-blue-50 text-blue-500 hover:bg-blue-100 focus:ring-blue-600'
              }`}
            >
              <span className="sr-only">Dismiss</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Upload Feedback</h1>
      
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => {
              setActiveTab('universal');
              setUploadStatus({ status: null, message: '', details: null });
            }}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'universal'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Universal Review Importer
          </button>
          <button
            onClick={() => {
              setActiveTab('csv');
              setUploadStatus({ status: null, message: '', details: null });
            }}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'csv'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Basic CSV Upload
          </button>
          <button
            onClick={() => {
              setActiveTab('manual');
              setUploadStatus({ status: null, message: '', details: null });
            }}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'manual'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Manual Entry
          </button>
        </nav>
      </div>

      {/* Universal Review Importer Tab */}
      {activeTab === 'universal' && (
        <UniversalReviewUploader />
      )}

      {/* Basic CSV Upload Tab */}
      {activeTab === 'csv' && (
        <div>
          <StatusMessage />
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-medium mb-4">Basic CSV Upload</h2>
            <div className="text-sm text-gray-600 mb-4 space-y-2">
              <p>
                Upload a CSV file with customer feedback. The CSV must include a{' '}
                <code className="bg-gray-100 px-1 rounded text-xs">feedback_text</code> column.
                Optional columns: <code className="bg-gray-100 px-1 rounded text-xs">source</code>,{' '}
                <code className="bg-gray-100 px-1 rounded text-xs">rating</code>,{' '}
                <code className="bg-gray-100 px-1 rounded text-xs">customer_name</code>.
              </p>
              <p className="text-xs text-gray-500 flex items-start">
                <svg className="h-4 w-4 mr-1 text-primary-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>
                  <strong>Important:</strong> Make sure all text containing commas is enclosed in quotes (""). 
                  Each row must have the same number of columns.
                </span>
              </p>
              <p>
                <a 
                  href="/sample_template.csv" 
                  download="feedback_template.csv"
                  className="text-primary-600 hover:text-primary-800 font-medium inline-flex items-center"
                >
                  <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                  Download CSV Template
                </a>
              </p>
            </div>
            
            <div
              {...getRootProps()}
              className={`mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors ${
                isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400'
              }`}
            >
              <div className="space-y-1 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="flex text-sm text-gray-600">
                  <input {...getInputProps()} />
                  <p className="text-center">
                    <span className="text-primary-600 hover:text-primary-500 font-medium">
                      Click to upload
                    </span>{' '}
                    or drag and drop a CSV file
                  </p>
                </div>
                <p className="text-xs text-gray-500">CSV files up to 5MB</p>
              </div>
            </div>

            {acceptedFiles.length > 0 && (
              <div className="mt-4 p-3 bg-gray-50 rounded">
                <h4 className="text-sm font-medium text-gray-700">Selected file:</h4>
                <div className="mt-1 text-sm text-gray-600">
                  {acceptedFiles[0].name} ({Math.round(acceptedFiles[0].size / 1024)} KB)
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manual Entry Tab */}
      {activeTab === 'manual' && (
        <div>
          <StatusMessage />
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-medium mb-4">Add Single Feedback</h2>
            <form onSubmit={handleSingleFeedbackSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="feedback_text" className="block text-sm font-medium text-gray-700">
                    Feedback Text*
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="feedback_text"
                      name="feedback_text"
                      rows={4}
                      className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="Enter customer feedback..."
                      value={singleFeedback.feedback_text}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="source" className="block text-sm font-medium text-gray-700">
                      Source
                    </label>
                    <select
                      id="source"
                      name="source"
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                      value={singleFeedback.source}
                      onChange={handleInputChange}
                    >
                      <option value="Manual Entry">Manual Entry</option>
                      <option value="Email">Email</option>
                      <option value="Phone">Phone</option>
                      <option value="In-Person">In-Person</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="rating" className="block text-sm font-medium text-gray-700">
                      Rating (1-5)
                    </label>
                    <select
                      id="rating"
                      name="rating"
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                      value={singleFeedback.rating}
                      onChange={handleInputChange}
                    >
                      <option value="">No Rating</option>
                      <option value="1">1 - Poor</option>
                      <option value="2">2 - Below Average</option>
                      <option value="3">3 - Average</option>
                      <option value="4">4 - Good</option>
                      <option value="5">5 - Excellent</option>
                    </select>
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={feedbackMutation.isLoading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {feedbackMutation.isLoading ? 'Submitting...' : 'Submit Feedback'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadFeedback;