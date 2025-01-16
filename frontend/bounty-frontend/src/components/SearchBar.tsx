import React, { useState } from "react";

interface SearchBarProps {
  onSearchChange: (query: string) => void;
}
const SearchBar: React.FC<SearchBarProps> = ({ onSearchChange }) => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSearchTerm(query);
    onSearchChange(query); 
  };


    function handleSearch(event: React.FormEvent) {
       event.preventDefault(); 
    }

  return (
    <form onChange={handleSearch} className="max-w-md mx-auto">
      <label
        htmlFor="default-search"
        className="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white"
      >
        Search
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
          <svg
            className="w-4 h-4 text-gray-500 dark:text-gray-400"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 20 20"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
            />
          </svg>
        </div>
        <input
          type="search"
          id="default-search"
          value={searchTerm}
          onChange={handleInputChange}
          className="block w-full p-4 ps-10 text-sm text-gray-900 border border-gray-600 rounded-lg bg-gray-700 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          placeholder="Search bounties..."
          required
        />
      
      </div>
    </form>
  );
};

export default SearchBar;
