import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

const SentimentChart = ({ data }) => {
  const chartData = {
    labels: ['Positive', 'Neutral', 'Negative'],
    datasets: [
      {
        data: [data.positive, data.neutral, data.negative],
        backgroundColor: [
          'rgba(34, 197, 94, 0.7)',  // green
          'rgba(250, 204, 21, 0.7)', // yellow
          'rgba(239, 68, 68, 0.7)',  // red
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(250, 204, 21, 1)',
          'rgba(239, 68, 68, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = data.total || 1;
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
  };

  return (
    <div className="h-64">
      <Pie data={chartData} options={options} />
    </div>
  );
};

export default SentimentChart;