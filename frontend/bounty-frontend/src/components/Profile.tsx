import React from "react";

const ProfileModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg z-50 w-1/3 text-white">
        <h2 className="text-lg font-bold mb-4">Profile</h2>
        <p>GitHub</p>
        <p>Contributions</p>
        <button
          className="mt-4 text-gray-text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-full text-sm px-5 py-2.5 me-2 mb-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700 "
          onClick={onClose}
        >
          &#x2715; Close
        </button>
      </div>
    </div>
  );
};

export default ProfileModal;
