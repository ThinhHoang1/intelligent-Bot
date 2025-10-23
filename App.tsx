
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import ChatWindow from './components/ChatWindow';
import InputBar from './components/InputBar';
import { ChatMessage, CsvTableData, GenerateContentPart, ChartData } from './types';
import { geminiService } from './services/geminiService';
import { csvService } from './services/csvService';
import { GenerateContentResponse } from '@google/genai';

function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [csvContextData, setCsvContextData] = useState<CsvTableData | null>(null);

  // Ref to hold a mutable `messages` array for use within `setTimeout` or async calls
  // without relying on the `messages` state which can be stale.
  const messagesRef = useRef(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const getCurrentTimestamp = (): string => {
    return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const getGeolocation = useCallback(async (): Promise<{ latitude: number; longitude: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser.');
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
          alert('Failed to get your location for Maps tool. Please enable location services.');
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    });
  }, []);

  const handleSendMessage = useCallback(async (
    text: string,
    imageUrl?: string,
    csvFile?: File,
    csvUrl?: string,
    useSearch: boolean = false,
    useMaps: boolean = false
  ) => {
    setIsLoading(true);
    const userMessageId = uuidv4();
    const modelMessageId = uuidv4();

    let newCsvContextData: CsvTableData | null = null;

    // Handle CSV file/URL upload first
    if (csvFile || csvUrl) {
      setMessages((prev) => [
        ...prev,
        {
          id: userMessageId,
          role: 'user',
          timestamp: getCurrentTimestamp(),
          text: csvFile ? `Uploaded CSV file: ${csvFile.name}` : `Provided CSV URL: ${csvUrl}`,
        },
        {
          id: modelMessageId,
          role: 'model',
          timestamp: getCurrentTimestamp(),
          isLoading: true, // Show loading for model's response to CSV upload
        },
      ]);
      const lastMessageIndex = messagesRef.current.length; // Use ref for correct index
      
      try {
        const parsedData = csvFile
          ? await csvService.parseCsvFile(csvFile)
          : await csvService.parseCsvUrl(csvUrl!);
        newCsvContextData = parsedData;
        setCsvContextData(newCsvContextData);

        setMessages((prevMessages) => {
          const updatedMessages = [...prevMessages];
          updatedMessages[lastMessageIndex + 1] = { // Update the loading message
            ...updatedMessages[lastMessageIndex + 1],
            isLoading: false,
            text: `CSV data loaded successfully! It has ${parsedData.rows.length} rows and ${parsedData.headers.length} columns. You can now ask questions about this data.`,
            csvTableData: { // Display a preview of the CSV
              headers: parsedData.headers,
              rows: parsedData.rows.slice(0, 5), // Show first 5 rows
            },
          };
          return updatedMessages;
        });
      } catch (error) {
        console.error('Error parsing CSV:', error);
        setMessages((prevMessages) => {
          const updatedMessages = [...prevMessages];
          updatedMessages[lastMessageIndex + 1] = {
            ...updatedMessages[lastMessageIndex + 1],
            isLoading: false,
            text: `Failed to load CSV data: ${(error as Error).message}`,
          };
          return updatedMessages;
        });
      } finally {
        setIsLoading(false);
      }
      return; // CSV upload handled, don't proceed with chat message for now
    }

    // Add user message to chat history
    setMessages((prev) => [
      ...prev,
      {
        id: userMessageId,
        role: 'user',
        timestamp: getCurrentTimestamp(),
        text: text,
        imageUrl: imageUrl,
      },
      {
        id: modelMessageId,
        role: 'model',
        timestamp: getCurrentTimestamp(),
        isLoading: true, // Show loading while model responds
      },
    ]);

    let modelResponseText = '';
    let responseGroundingUrls: string[] | undefined = undefined;
    let modelChartData: ChartData | undefined = undefined;

    try {
      if (useSearch) {
        const response = await geminiService.sendSearchQuery(text);
        modelResponseText = response.text;
        if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
          responseGroundingUrls = response.candidates[0].groundingMetadata.groundingChunks
            .map(chunk => (chunk as any).web?.uri)
            .filter(Boolean);
        }
      } else if (useMaps) {
        const location = await getGeolocation();
        if (!location) {
          modelResponseText = "Could not get your location to use the Maps tool.";
        } else {
          const response = await geminiService.sendMapsQuery(text, location.latitude, location.longitude);
          modelResponseText = response.text;
          if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
            responseGroundingUrls = response.candidates[0].groundingMetadata.groundingChunks
              .map(chunk => (chunk as any).maps?.uri)
              .filter(Boolean);
          }
        }
      } else if (csvContextData && text.toLowerCase().includes('summarize dataset')) {
        modelResponseText = `Summary of the loaded CSV dataset:\n\n- Number of rows: ${csvContextData.rows.length}\n- Number of columns: ${csvContextData.headers.length}\n- Columns: ${csvContextData.headers.join(', ')}`;
        // Optionally, send this to Gemini for a more natural language summary
        // const geminiSummary = await geminiService.sendCsvContextMessage('Summarize this data for me.', csvContextData);
        // modelResponseText += `\n\n${geminiSummary.text}`;
      } else if (csvContextData && text.toLowerCase().includes('basic stats')) {
        modelResponseText = csvService.getBasicStats(csvContextData);
      } else if (csvContextData && text.toLowerCase().includes('missing values')) {
        modelResponseText = csvService.getMissingValues(csvContextData);
      } else if (csvContextData && text.toLowerCase().includes('plot')) {
        const plotMatch = text.toLowerCase().match(/plot (a )?(histogram|bar chart|line chart) of (\w+)/);
        if (plotMatch && plotMatch[3]) {
          const columnName = plotMatch[3];
          const chartType = plotMatch[2] as 'histogram' | 'bar' | 'line';
          const histogramData = csvService.getHistogramData(csvContextData, columnName);
          if (histogramData) {
            modelChartData = {
              type: chartType, // For simplicity, histogram will use bar chart component
              data: histogramData,
              xKey: 'name',
              yKey: 'value',
              label: `${chartType} of ${columnName}`,
            };
            modelResponseText = `Here's a ${chartType} for the column "${columnName}":`;
          } else {
            modelResponseText = `Could not generate a plot for column "${columnName}". It might not be numeric or found in the dataset.`;
          }
        } else {
          modelResponseText = "Please specify 'plot [chart type] of [column name]' to generate a chart.";
        }
      } else {
        // Default to multimodal or text generation
        const parts: GenerateContentPart[] = [];
        if (text) parts.push({ text });
        if (imageUrl) parts.push({ inlineData: { mimeType: 'image/jpeg', data: imageUrl.split(',')[1] } }); // Extract base64 part

        if (parts.length === 0) {
          modelResponseText = "Please provide text or an image.";
        } else {
          const stream = await geminiService.sendMessageStream(parts);
          for await (const chunk of stream) {
            modelResponseText += chunk.text;
            // Update the last message in state with new text chunks
            setMessages((prevMessages) => {
              const updatedMessages = [...prevMessages];
              const lastModelMessageIndex = updatedMessages.findIndex(m => m.id === modelMessageId);
              if (lastModelMessageIndex !== -1) {
                updatedMessages[lastModelMessageIndex] = {
                  ...updatedMessages[lastModelMessageIndex],
                  text: modelResponseText,
                };
              }
              return updatedMessages;
            });
          }
        }
      }

    } catch (error) {
      console.error('Gemini API error:', error);
      modelResponseText = `Error: Failed to get a response from Gemini. ${(error as Error).message}`;
    } finally {
      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages];
        const lastModelMessageIndex = updatedMessages.findIndex(m => m.id === modelMessageId);
        if (lastModelMessageIndex !== -1) {
          updatedMessages[lastModelMessageIndex] = {
            ...updatedMessages[lastModelMessageIndex],
            text: modelResponseText,
            isLoading: false, // Turn off loading
            chartData: modelChartData, // Add chart data if generated
            groundingUrls: responseGroundingUrls,
          };
        }
        return updatedMessages;
      });
      setIsLoading(false);
    }
  }, [csvContextData, getGeolocation]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClearCSVContext = useCallback(() => {
    setCsvContextData(null);
    setMessages((prev) => [
      ...prev,
      {
        id: uuidv4(),
        role: 'model',
        timestamp: getCurrentTimestamp(),
        text: 'CSV data context has been cleared.',
      },
    ]);
  }, []);

  useEffect(() => {
    // Initial welcome message
    setMessages([
      {
        id: uuidv4(),
        role: 'model',
        timestamp: getCurrentTimestamp(),
        text: 'Hello! I am Gemini, ready to chat, analyze images, or explore CSV data. How can I help you?',
      },
    ]);
  }, []);

  return (
    <div className="flex flex-col h-full w-full bg-white rounded-lg shadow-2xl">
      <header className="p-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-t-lg shadow-md">
        <h1 className="text-xl font-bold">Intelligent Bot</h1>
      </header>
      <ChatWindow messages={messages} />
      <InputBar
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        onClearCSVContext={handleClearCSVContext}
        hasCSVContext={!!csvContextData}
      />
    </div>
  );
}

export default App;