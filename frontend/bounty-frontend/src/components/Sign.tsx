import React, { useState } from "react";

interface SignProps {
  bounty: {
    name: string;
    tasks: string;
    reward: string;
    required_signatories: string[];
  };
}

const Sign: React.FC<SignProps> = ({ bounty }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasbountyToken, setHasBountyToken] = useState(false);

  const handleContributeClick = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSign = () => {
    // logic here
    console.log(`User signed to contribute to ${bounty.name}`);
    setIsModalOpen(false);
  };
  return (
    <>
      <button
        type="button"
        className="text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-semibold rounded-lg text-base px-6 py-3 transition duration-200 ease-in-out"
      >
        Sign
      </button>
    </>
  );
};

export default Sign;
