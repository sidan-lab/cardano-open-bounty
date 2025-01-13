import React from "react";

const ProfileModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg z-50 w-1/3 text-white">
        <h2 className="text-lg font-bold mb-4">Profile</h2>
        <p>ID token</p>
        <p>No bounty token</p>
        <button
          className="mt-4 text-gray-300 hover:text-white"
          onClick={onClose}
        >
          &#x2715; Close
        </button>
      </div>
    </div>
  );
};

export default ProfileModal;
