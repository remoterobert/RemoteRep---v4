import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const data = {
    labels: ['2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023'],
    datasets: [
      {
        type: 'line',
        label: 'Yearly Growth',
        data: [5, 10, 20, 35, 50, 65, 80, 40, 10],
        borderColor: 'rgba(0, 123, 255, 1)',
        backgroundColor: 'rgba(0, 123, 255, 0.3)',
        fill: true,
        tension: 0.1,
      },
      {
        type: 'bar',
        label: 'Companies',
        data: [5, 10, 15, 25, 35, 45, 55, 20],
        backgroundColor: 'rgba(255, 205, 86, 1)',
      },
      {
        type: 'bar',
        label: 'Listings',
        data: [3, 6, 10, 15, 25, 35, 45, 18],
        backgroundColor: 'rgba(255, 99, 132, 1)',
      },
      {
        type: 'bar',
        label: 'Talent',
        data: [3, 6, 10, 15, 25, 35, 45, 18],
        backgroundColor: '#27AE60',
      },
    ],
  };
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: {
          color: '#3F5296',
        },
      },
    },
    scales: {
      x: {
        title: {
          display: false,
          text: 'Year',
          color: 'white',
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
          text: 'Activity',
          color: 'white',
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
  
  const ActiveUsersChart: React.FC = () => {
    return (
      <div className="p-5 rounded-lg shadow-lg w-full h-[90%]">
        <h2 className="text-black dark:text-white text-2xl mb-4">Active Users</h2>
        <div className="w-full h-full">
          <Line data={data} options={options} />
        </div>
      </div>
    );
  };
  
  export default ActiveUsersChart;