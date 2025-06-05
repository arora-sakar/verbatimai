import React, { useState } from 'react';
import { useMutation } from 'react-query';
import api from '../../services/api';
import { useQueryInvalidation } from '../../hooks/useQueryInvalidation';

const UniversalReviewUploader = () => {
  const { invalidateDashboard } = useQueryInvalidation();
  const [file, setFile] = useState(null);
  const [validation, setValidation] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [supportedFormats, setSupportedFormats] = useState(null);

  // Load supported formats on component mount
  React.useEffect(() => {
    const loadSupportedFormats = async () => {
      try {
        const response = await api.get('/feedback/supported-formats');
        setSupportedFormats(response.data);
      } catch (error) {
        console.error('Failed to load supported formats:', error);
      }
    };
    loadSupportedFormats();
  }, []);

  // Validation mutation
  const validateMutation = useMutation(
    async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post('/feedback/validate-csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    {
      onSuccess: (data) => {
        setValidation(data);
      },
      onError: (error) => {
        setValidation({
          valid: false,
          error: error.response?.data?.detail || 'Validation failed',
        });
      },
    }
  );

  // Upload mutation
  const uploadMutation = useMutation(
    async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post('/feedback/upload-universal', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    {
      onSuccess: (data) => {
        setResult(data);
        invalidateDashboard();
        setUploading(false);
      },
      onError: (error) => {
        setResult({ error: error.response?.data?.detail || 'Upload failed' });
        setUploading(false);
      },
    }
  );

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setResult(null);
    setValidation(null);

    // Validate file format
    validateMutation.mutate(selectedFile);
  };

  const handleUpload = () => {
    if (!file || !validation?.valid) return;

    setUploading(true);
    uploadMutation.mutate(file);
  };

  const PlatformCard = ({ platform }) => (
    <div className="text-sm">
      <div className="font-medium text-blue-800">{platform.name}</div>
      <div className="text-blue-600 text-xs">
        Required: {platform.required_columns.join(', ')}
      </div>
      {platform.optional_columns && (
        <div className="text-blue-500 text-xs">
          Optional: {platform.optional_columns.join(', ')}
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Universal Review Importer
        </h2>
        <p className="text-gray-600">
          Import reviews from any platform - Google, Yelp, Facebook, Amazon, and more
        </p>
      </div>

      {/* Supported Formats */}
      {supportedFormats && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-start space-x-3">
            {/* Info Icon */}
            <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Supported Platforms</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {supportedFormats.supported_platforms.map((platform, index) => (
                  <PlatformCard key={index} platform={platform} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* File Upload */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
        <div className="text-center">
          {/* Upload Icon */}
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <div className="mb-4">
            <label htmlFor="file-upload" className="cursor-pointer">
              <span className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Choose CSV File
              </span>
              <input
                id="file-upload"
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          </div>
          {file && (
            <p className="text-sm text-gray-600">
              Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </p>
          )}
        </div>
      </div>

      {/* Validation Results */}
      {validation && (
        <div className={`p-4 rounded-lg ${
          validation.valid ? 'bg-green-50' : 'bg-red-50'
        }`}>
          <div className="flex items-start space-x-3">
            {validation.valid ? (
              /* CheckCircle Icon */
              <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              /* AlertCircle Icon */
              <svg className="w-5 h-5 text-red-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <div className="flex-1">
              {validation.valid ? (
                <div>
                  <h3 className="font-semibold text-green-900 mb-2">File Valid!</h3>
                  <div className="space-y-2 text-sm text-green-800">
                    <p><strong>Detected Platform:</strong> {validation.detected_platform}</p>
                    <p><strong>Total Reviews:</strong> {validation.total_rows}</p>
                    <p><strong>Valid Reviews:</strong> {validation.valid_rows}</p>
                    {validation.invalid_rows > 0 && (
                      <p className="text-orange-600">
                        <strong>Skipped:</strong> {validation.invalid_rows} invalid rows
                      </p>
                    )}
                    {validation.issues && validation.issues.length > 0 && (
                      <div>
                        <strong>Issues found:</strong>
                        <ul className="list-disc ml-4">
                          {validation.issues.map((issue, index) => (
                            <li key={index} className="text-xs">{issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  {validation.preview && validation.preview.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium text-green-900 mb-2">Preview:</h4>
                      <div className="bg-white p-3 rounded border max-h-40 overflow-y-auto">
                        {validation.preview.map((review, index) => (
                          <div key={index} className="text-xs mb-2 pb-2 border-b last:border-b-0">
                            <div className="flex items-center space-x-2">
                              {review.rating && (
                                <span className="font-medium">Rating: {review.rating}/5</span>
                              )}
                              <span className="text-gray-500">|</span>
                              <span>{review.source}</span>
                              {review.reviewer_name && (
                                <>
                                  <span className="text-gray-500">|</span>
                                  <span>{review.reviewer_name}</span>
                                </>
                              )}
                            </div>
                            {review.comment && (
                              <p className="text-gray-700 mt-1 truncate">
                                {review.comment.substring(0, 100)}...
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <h3 className="font-semibold text-red-900 mb-2">Validation Failed</h3>
                  <p className="text-red-800 mb-2">{validation.error}</p>
                  {validation.suggestions && (
                    <ul className="text-sm text-red-700 space-y-1">
                      {validation.suggestions.map((suggestion, index) => (
                        <li key={index}>• {suggestion}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upload Button */}
      {validation?.valid && (
        <div className="text-center">
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? 'Importing Reviews...' : 'Import Reviews'}
          </button>
        </div>
      )}

      {/* Upload Results */}
      {result && (
        <div className={`p-4 rounded-lg ${
          result.error ? 'bg-red-50' : 'bg-green-50'
        }`}>
          <div className="flex items-start space-x-3">
            {result.error ? (
              /* AlertCircle Icon */
              <svg className="w-5 h-5 text-red-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              /* CheckCircle Icon */
              <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <div>
              {result.error ? (
                <div>
                  <h3 className="font-semibold text-red-900 mb-1">Upload Failed</h3>
                  <p className="text-red-800">{result.error}</p>
                </div>
              ) : (
                <div>
                  <h3 className="font-semibold text-green-900 mb-2">Import Successful!</h3>
                  <div className="space-y-1 text-sm text-green-800">
                    <p><strong>Imported:</strong> {result.imported_count} reviews</p>
                    <p><strong>Analyzed:</strong> {result.analyzed_count} reviews</p>
                    <p><strong>Platform:</strong> {result.detected_platform}</p>
                    {result.source_breakdown && (
                      <div>
                        <strong>Sources:</strong>
                        <ul className="ml-4">
                          {Object.entries(result.source_breakdown).map(([source, count]) => (
                            <li key={source}>• {source}: {count} reviews</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      {supportedFormats && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">How to Export Reviews:</h3>
          <div className="space-y-3 text-sm text-gray-700">
            {supportedFormats.supported_platforms.map((platform, index) => (
              <div key={index}>
                <p className="font-medium text-gray-800">{platform.name}:</p>
                {platform.export_instructions ? (
                  <p className="ml-4 text-gray-600">• {platform.export_instructions}</p>
                ) : (
                  <p className="ml-4 text-gray-600">• Export any CSV with rating and review text columns</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UniversalReviewUploader;