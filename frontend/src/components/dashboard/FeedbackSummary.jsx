const FeedbackSummary = ({ data }) => {
  const { positive, negative, neutral, total } = data;

  // Calculate percentages
  const positivePercentage = total > 0 ? Math.round((positive / total) * 100) : 0;
  const negativePercentage = total > 0 ? Math.round((negative / total) * 100) : 0;
  const neutralPercentage = total > 0 ? Math.round((neutral / total) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-sm font-medium text-gray-700">Total Feedback</div>
        <div className="text-lg font-semibold">{total}</div>
      </div>
      
      <div className="h-px bg-gray-200 my-2"></div>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <div className="text-sm font-medium text-green-600">Positive</div>
          <div className="text-sm font-medium">{positive} ({positivePercentage}%)</div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-green-600 h-2.5 rounded-full" 
            style={{ width: `${positivePercentage}%` }}
          ></div>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <div className="text-sm font-medium text-yellow-500">Neutral</div>
          <div className="text-sm font-medium">{neutral} ({neutralPercentage}%)</div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-yellow-500 h-2.5 rounded-full" 
            style={{ width: `${neutralPercentage}%` }}
          ></div>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <div className="text-sm font-medium text-red-600">Negative</div>
          <div className="text-sm font-medium">{negative} ({negativePercentage}%)</div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-red-600 h-2.5 rounded-full" 
            style={{ width: `${negativePercentage}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackSummary;