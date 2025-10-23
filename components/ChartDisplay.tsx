
import React from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartData } from '../types';

interface ChartDisplayProps {
  chartData: ChartData;
}

const ChartDisplay: React.FC<ChartDisplayProps> = ({ chartData }) => {
  if (!chartData || !chartData.data || chartData.data.length === 0) {
    return <div className="text-gray-500 text-sm mt-2">No chart data available.</div>;
  }

  const { type, data, xKey, yKey, label } = chartData;

  const ChartComponent = type === 'bar' || type === 'histogram' ? BarChart : LineChart;
  const DataComponent = type === 'bar' || type === 'histogram' ? Bar : Line;

  return (
    <div className="w-full h-64 my-4 p-4 bg-gray-50 rounded-lg shadow-sm">
      {label && <h4 className="text-center text-md font-semibold mb-3 text-gray-700">{label}</h4>}
      <ResponsiveContainer width="100%" height="100%">
        <ChartComponent
          data={data}
          margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis dataKey={xKey} tick={{ fill: '#6b7280', fontSize: 12 }} />
          <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
          <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px' }} itemStyle={{ color: '#374151' }} />
          <DataComponent dataKey={yKey || 'value'} fill={type === 'line' ? '#8884d8' : '#82ca9d'} stroke="#8884d8" />
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  );
};

export default ChartDisplay;
