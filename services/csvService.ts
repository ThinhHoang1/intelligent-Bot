
import Papa from 'papaparse';
import { CsvTableData } from '../types';

export const csvService = {
  async parseCsvFile(file: File): Promise<CsvTableData> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            reject(new Error(results.errors[0].message));
            return;
          }
          const headers = results.meta.fields || [];
          const rows = results.data.map((row: any) =>
            headers.map((header) => row[header] !== undefined && row[header] !== null ? String(row[header]) : '')
          );
          resolve({ headers, rows });
        },
        error: (error: Error) => {
          reject(error);
        },
      });
    });
  },

  async parseCsvUrl(url: string): Promise<CsvTableData> {
    return new Promise((resolve, reject) => {
      Papa.parse(url, {
        download: true,
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            reject(new Error(results.errors[0].message));
            return;
          }
          const headers = results.meta.fields || [];
          const rows = results.data.map((row: any) =>
            headers.map((header) => row[header] !== undefined && row[header] !== null ? String(row[header]) : '')
          );
          resolve({ headers, rows });
        },
        error: (error: Error) => {
          reject(error);
        },
      });
    });
  },

  getNumericColumns(csvData: CsvTableData): { name: string; values: number[] }[] {
    return csvData.headers
      .map((header) => {
        const values = csvData.rows
          .map((row) => parseFloat(row[csvData.headers.indexOf(header)]))
          .filter((value) => !isNaN(value));
        return { name: header, values };
      })
      .filter((col) => col.values.length > 0);
  },

  getBasicStats(csvData: CsvTableData): string {
    const numericColumns = csvService.getNumericColumns(csvData);
    if (numericColumns.length === 0) {
      return "No numeric columns found for statistics.";
    }

    let statsOutput = "Basic Statistics:\n";
    numericColumns.forEach((col) => {
      const sortedValues = [...col.values].sort((a, b) => a - b);
      const min = sortedValues[0];
      const max = sortedValues[sortedValues.length - 1];
      const sum = sortedValues.reduce((a, b) => a + b, 0);
      const mean = sum / sortedValues.length;
      const median =
        sortedValues.length % 2 === 0
          ? (sortedValues[sortedValues.length / 2 - 1] + sortedValues[sortedValues.length / 2]) / 2
          : sortedValues[Math.floor(sortedValues.length / 2)];

      statsOutput += `\n**${col.name}**:\n`;
      statsOutput += `  - Count: ${col.values.length}\n`;
      statsOutput += `  - Min: ${min.toFixed(2)}\n`;
      statsOutput += `  - Max: ${max.toFixed(2)}\n`;
      statsOutput += `  - Mean: ${mean.toFixed(2)}\n`;
      statsOutput += `  - Median: ${median.toFixed(2)}\n`;
    });
    return statsOutput;
  },

  getMissingValues(csvData: CsvTableData): string {
    let missingOutput = "Missing Values per Column:\n";
    let hasMissing = false;

    csvData.headers.forEach((header, colIndex) => {
      let missingCount = 0;
      csvData.rows.forEach((row) => {
        if (!row[colIndex] || row[colIndex].trim() === '') {
          missingCount++;
        }
      });
      if (missingCount > 0) {
        hasMissing = true;
        missingOutput += `  - **${header}**: ${missingCount} missing values (${((missingCount / csvData.rows.length) * 100).toFixed(2)}%)\n`;
      }
    });

    if (!hasMissing) {
      return "No missing values found in the dataset.";
    }
    return missingOutput;
  },

  getHistogramData(csvData: CsvTableData, columnName: string): { name: string; value: number }[] | null {
    const columnIndex = csvData.headers.indexOf(columnName);
    if (columnIndex === -1) {
      return null; // Column not found
    }

    const columnValues = csvData.rows
      .map((row) => parseFloat(row[columnIndex]))
      .filter((value) => !isNaN(value));

    if (columnValues.length === 0) {
      return null; // No numeric data in column
    }

    // Simple binning for histogram
    const min = Math.min(...columnValues);
    const max = Math.max(...columnValues);
    const numBins = Math.min(10, Math.max(5, Math.floor(Math.sqrt(columnValues.length)))); // Heuristic for num bins
    const binSize = (max - min) / numBins;

    const bins: { [key: string]: number } = {};
    for (let i = 0; i < numBins; i++) {
      const lowerBound = min + i * binSize;
      const upperBound = min + (i + 1) * binSize;
      bins[`${lowerBound.toFixed(2)}-${upperBound.toFixed(2)}`] = 0;
    }

    columnValues.forEach((value) => {
      let binIndex = Math.floor((value - min) / binSize);
      if (binIndex >= numBins) binIndex = numBins - 1; // Put max value in the last bin
      const lowerBound = min + binIndex * binSize;
      const upperBound = min + (binIndex + 1) * binSize;
      const key = `${lowerBound.toFixed(2)}-${upperBound.toFixed(2)}`;
      bins[key]++;
    });

    return Object.entries(bins).map(([name, value]) => ({ name, value }));
  },
};
