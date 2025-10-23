
import React, { useState, useRef, ChangeEvent } from 'react';

interface InputBarProps {
  onSendMessage: (text: string, imageUrl?: string, csvFile?: File, csvUrl?: string, useSearch?: boolean, useMaps?: boolean) => Promise<void>;
  isLoading: boolean;
  onClearCSVContext: () => void;
  hasCSVContext: boolean;
}

const InputBar: React.FC<InputBarProps> = ({ onSendMessage, isLoading, onClearCSVContext, hasCSVContext }) => {
  const [inputText, setInputText] = useState<string>('');
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [selectedCsvFile, setSelectedCsvFile] = useState<File | null>(null);
  const [csvUrlInput, setCsvUrlInput] = useState<string>('');
  const [isCsvInputVisible, setIsCsvInputVisible] = useState<boolean>(false);
  const [useSearchTool, setUseSearchTool] = useState<boolean>(false);
  const [useMapsTool, setUseMapsTool] = useState<boolean>(false);

  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const csvFileInputRef = useRef<HTMLInputElement>(null);

  const handleTextChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
  };

  const handleImageFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedImageFile(null);
      setImagePreviewUrl(null);
    }
  };

  const handleCsvFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setSelectedCsvFile(file || null);
    if (file) {
      setCsvUrlInput(''); // Clear URL if file is selected
    }
  };

  const handleCsvUrlChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCsvUrlInput(e.target.value);
    if (e.target.value) {
      setSelectedCsvFile(null); // Clear file if URL is entered
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading) {
      void handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (isLoading || (!inputText && !selectedImageFile && !selectedCsvFile && !csvUrlInput && !useSearchTool && !useMapsTool)) {
      return;
    }

    await onSendMessage(
      inputText,
      imagePreviewUrl || undefined,
      selectedCsvFile || undefined,
      csvUrlInput || undefined,
      useSearchTool,
      useMapsTool
    );

    // Clear inputs after sending
    setInputText('');
    setSelectedImageFile(null);
    setImagePreviewUrl(null);
    if (imageFileInputRef.current) imageFileInputRef.current.value = '';

    setSelectedCsvFile(null);
    setCsvUrlInput('');
    // Fix: Access .current before .value on a RefObject
    if (csvFileInputRef.current) csvFileInputRef.current.value = '';
    
    // Clear tool selections
    setUseSearchTool(false);
    setUseMapsTool(false);
  };

  return (
    <div className="border-t border-gray-200 p-4 bg-gray-50 flex flex-col">
      {imagePreviewUrl && (
        <div className="mb-3 p-2 border border-gray-300 rounded-md flex items-center justify-between bg-white shadow-sm">
          <img src={imagePreviewUrl} alt="Image preview" className="h-16 w-16 object-cover rounded mr-3" />
          <span className="text-sm text-gray-700 truncate">{selectedImageFile?.name || 'Image'}</span>
          <button
            onClick={() => {
              setSelectedImageFile(null);
              setImagePreviewUrl(null);
              if (imageFileInputRef.current) imageFileInputRef.current.value = '';
            }}
            className="ml-4 p-1 text-red-600 hover:text-red-800 rounded-full focus:outline-none focus:ring-2 focus:ring-red-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {selectedCsvFile && (
        <div className="mb-3 p-2 border border-gray-300 rounded-md flex items-center justify-between bg-white shadow-sm">
          <span className="text-sm text-gray-700 truncate">{selectedCsvFile.name}</span>
          <button
            onClick={() => {
              setSelectedCsvFile(null);
              if (csvFileInputRef.current) csvFileInputRef.current.value = '';
            }}
            className="ml-4 p-1 text-red-600 hover:text-red-800 rounded-full focus:outline-none focus:ring-2 focus:ring-red-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {csvUrlInput && !selectedCsvFile && (
        <div className="mb-3 p-2 border border-gray-300 rounded-md flex items-center justify-between bg-white shadow-sm">
          <span className="text-sm text-gray-700 truncate">{csvUrlInput}</span>
          <button
            onClick={() => setCsvUrlInput('')}
            className="ml-4 p-1 text-red-600 hover:text-red-800 rounded-full focus:outline-none focus:ring-2 focus:ring-red-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {hasCSVContext && (
        <div className="flex items-center justify-between mb-3 p-2 border border-blue-300 rounded-md bg-blue-50 shadow-sm text-blue-800">
          <span className="text-sm font-medium">CSV Data Context Active</span>
          <button
            onClick={onClearCSVContext}
            className="ml-4 px-2 py-1 bg-blue-200 text-blue-800 text-xs font-semibold rounded-full hover:bg-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
            disabled={isLoading}
          >
            Clear Context
          </button>
        </div>
      )}

      {isCsvInputVisible && (
        <div className="mb-3 p-3 border border-gray-300 rounded-md bg-white shadow-sm flex flex-col space-y-2">
          <div className="flex items-center">
            <label htmlFor="csv-file-upload" className="flex items-center justify-center w-24 px-3 py-2 border border-gray-300 rounded-l-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
              CSV File
            </label>
            <input
              id="csv-file-upload"
              ref={csvFileInputRef}
              type="file"
              accept=".csv"
              onChange={handleCsvFileChange}
              className="sr-only"
              disabled={isLoading}
            />
            <input
              type="text"
              placeholder="Or paste CSV URL"
              value={csvUrlInput}
              onChange={handleCsvUrlChange}
              className="flex-1 min-w-0 border border-gray-300 rounded-r-md shadow-sm px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              disabled={isLoading}
            />
          </div>
          <button
            onClick={() => setIsCsvInputVisible(false)}
            className="text-gray-500 hover:text-gray-700 text-xs self-end"
          >
            Close CSV Input
          </button>
        </div>
      )}

      <div className="flex items-center space-x-2 mb-3">
        <button
          onClick={() => setIsCsvInputVisible(!isCsvInputVisible)}
          className="p-2 text-gray-600 hover:text-blue-700 hover:bg-blue-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-300"
          title="Upload CSV"
          disabled={isLoading}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </button>
        <label htmlFor="image-file-upload" className="p-2 text-gray-600 hover:text-blue-700 hover:bg-blue-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-300 cursor-pointer" title="Upload Image">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <input
            id="image-file-upload"
            ref={imageFileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageFileChange}
            className="sr-only"
            disabled={isLoading}
          />
        </label>
        <button
          onClick={() => setUseSearchTool(!useSearchTool)}
          className={`p-2 rounded-full transition-colors duration-200 ${useSearchTool ? 'bg-green-200 text-green-700' : 'text-gray-600 hover:text-green-700 hover:bg-green-100'} focus:outline-none focus:ring-2 focus:ring-green-300`}
          title="Use Google Search"
          disabled={isLoading}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
        <button
          onClick={() => setUseMapsTool(!useMapsTool)}
          className={`p-2 rounded-full transition-colors duration-200 ${useMapsTool ? 'bg-purple-200 text-purple-700' : 'text-gray-600 hover:text-purple-700 hover:bg-purple-100'} focus:outline-none focus:ring-2 focus:ring-purple-300`}
          title="Use Google Maps"
          disabled={isLoading}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.723A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 13V7m0 0l3.553-1.776A1 1 0 0121 5.618v10.764a1 1 0 01-.447.894L15 20m-6-3l.008-.008" />
          </svg>
        </button>
      </div>

      <div className="flex items-center space-x-3">
        <input
          type="text"
          value={inputText}
          onChange={handleTextChange}
          onKeyPress={handleKeyPress}
          placeholder="Ask me anything..."
          className="flex-1 p-3 border border-gray-600 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-800 text-white placeholder-gray-400"
          disabled={isLoading}
        />
        <button
          onClick={handleSubmit}
          className="p-3 bg-blue-600 text-white rounded-full shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading}
          title="Send Message"
        >
          {isLoading ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};

export default InputBar;