import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        title: {
          display: false,
          text: 'Year',
        },
        grid: {
            color: '#3F5296',
          },
        ticks: {
          color: '#3F5296',
        },
      },
      y: {
        title: {
          display: false,
          text: 'Growth',
        },
        beginAtZero: true,
        max: 100,
        grid: {
            color: '#3F5296',
          },
        ticks: {
          color: '#3F5296',
        },
      },
    },
  };

  const data = {
    labels: ['2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023'],
    datasets: [
      {
        label: 'Growth',
        data: [5, 15, 45, 55, 75, 80, 6, 12],
        borderColor: 'rgba(0, 123, 255, 1)',
        backgroundColor: 'rgba(0, 123, 255, 0.3)',
        fill: true,
        tension: 0.1,
      },
    ],
  };

  const GrowthChart: React.FC = () => {
    return (
      <div className="p-5 rounded-lg shadow-lg w-full h-[90%]">
        <h2 className="text-black dark:text-white text-2xl mb-4">Growth</h2>
        <div className="w-full h-full">
          <Line data={data} options={options} />
        </div>
      </div>
    );
  };
  
  export default GrowthChart;