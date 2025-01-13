import React from "react";

const SearchBar: React.FC = () => {
  return (
    <div className="mb-4">
      <input
        type="text"
        placeholder="Search..."
        className="w-full bg-gray-700 text-white rounded px-4 py-2"
      />
    </div>
  );
};

export default SearchBar;
