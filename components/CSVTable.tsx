
import React from 'react';
import { CsvTableData } from '../types';

interface CSVTableProps {
  data: CsvTableData;
  maxRows?: number;
}

const CSVTable: React.FC<CSVTableProps> = ({ data, maxRows = 5 }) => {
  const displayRows = data.rows.slice(0, maxRows);
  const hasMoreRows = data.rows.length > maxRows;

  return (
    <div className="overflow-x-auto rounded-lg shadow-sm border border-gray-200 my-2">
      <table className="min-w-full divide-y divide-gray-200 bg-white">
        <thead className="bg-gray-50">
          <tr>
            {data.headers.map((header, index) => (
              <th
                key={index}
                scope="col"
                className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {displayRows.map((row, rowIndex) => (
            <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
          {hasMoreRows && (
            <tr className="bg-gray-100">
              <td colSpan={data.headers.length} className="px-4 py-2 text-center text-xs text-gray-500 italic">
                ... {data.rows.length - maxRows} more rows
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default CSVTable;
