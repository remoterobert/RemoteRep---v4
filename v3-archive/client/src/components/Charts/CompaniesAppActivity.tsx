// components/CompaniesAppActivity.tsx
import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const data = {
  labels: ['Bookmarked', 'Invited', 'Applied', 'Interviewing', 'Short-listed', 'Hired'],
  datasets: [
    {
      data: [330, 320, 110, 100, 80, 60],
      backgroundColor: [
        'rgba(75, 192, 192, 1)',  // Green
        'rgba(255, 99, 132, 1)',  // Pink
        'rgba(255, 205, 86, 1)',  // Yellow
        'rgba(255, 159, 64, 1)',  // Orange
        'rgba(54, 162, 235, 1)',  // Blue
        'rgba(153, 102, 255, 1)'  // Purple
      ],
      hoverBackgroundColor: [
        'rgba(75, 192, 192, 0.8)',
        'rgba(255, 99, 132, 0.8)',
        'rgba(255, 205, 86, 0.8)',
        'rgba(255, 159, 64, 0.8)',
        'rgba(54, 162, 235, 0.8)',
        'rgba(153, 102, 255, 0.8)'
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
      display: false,
    },
  },
};

const CompaniesAppActivity: React.FC = () => {
  return (
    <div className="p-5 rounded-lg shadow-lg w-full h-96">
      <h2 className="text-black dark:text-white text-2xl mb-4">In App Activity (Companies)</h2>
      <div className="flex p-4 justify-between">
        <div className="w-[180px] h-[180px]">
          <Doughnut data={data} options={options} />
        </div>
        <div className="w-1/3 text-lg flex flex-col justify-center space-y-2 text-black dark:text-white">
          {data.labels.map((label, index) => (
            <div key={index} className="flex items-center">
              <span
                className="inline-block w-3 h-3 mr-2 rounded-2xl"
                style={{ backgroundColor: data.datasets[0].backgroundColor[index] }}
              ></span>
              <span className="flex-1 text-xs">{label}</span>
              <span className="flex-1 text-right text-sm">{((data.datasets[0].data[index] / data.datasets[0].data.reduce((a, b) => a + b)) * 100).toFixed(0)}%</span>
              <span className="flex-1 text-right text-sm">{data.datasets[0].data[index]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CompaniesAppActivity;
