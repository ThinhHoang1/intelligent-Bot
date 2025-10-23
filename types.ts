
export type ChatRole = 'user' | 'model';

export interface CsvTableData {
  headers: string[];
  rows: string[][];
}

export interface ChartData {
  type: 'bar' | 'line' | 'histogram';
  data: any[]; // Data for recharts, e.g., [{ name: 'Category A', value: 10 }]
  xKey: string;
  yKey?: string;
  label?: string; // Title for the chart
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  timestamp: string;
  text?: string;
  imageUrl?: string;
  csvTableData?: CsvTableData;
  chartData?: ChartData;
  groundingUrls?: string[];
  isLoading?: boolean; // For streaming responses, indicates if the model is still typing
}

export interface GenerateContentPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string; // Base64 encoded image
  };
}
