import React from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
} from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
)

function AnalyticsChart({ data, type = 'line', title, color = '#3B82F6' }) {
  if (!data || !data.length) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No data available</p>
      </div>
    )
  }

  const chartData = {
    labels: data.map(item => {
      const date = new Date(item.date)
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }),
    datasets: [
      {
        label: title,
        data: data.map(item => item.value),
        borderColor: color,
        backgroundColor: type === 'bar' ? `${color}20` : `${color}10`,
        borderWidth: 2,
        fill: type === 'line',
        tension: 0.4,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: title,
        font: {
          size: 16,
          weight: 'bold',
        },
        color: '#374151',
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false,
        },
        ticks: {
          maxTicksLimit: 7,
        },
      },
      y: {
        display: true,
        grid: {
          color: '#F3F4F6',
        },
        beginAtZero: true,
      },
    },
    elements: {
      point: {
        radius: type === 'line' ? 4 : 0,
        hoverRadius: 6,
      },
    },
  }

  const ChartComponent = type === 'bar' ? Bar : Line

  return (
    <div className="h-64 w-full">
      <ChartComponent data={chartData} options={options} />
    </div>
  )
}

export default AnalyticsChart 