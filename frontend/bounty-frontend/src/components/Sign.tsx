import React, { useState } from "react";

const Sign: React.FC = () => {
  const bounty = {
    name: "Project-A: Fix Bugs",
    required_signatories: ["signatory1", "signatory2", "signatory3"],
    contributer_signed: [
      { name: "signatory1", github: "https://github.com/signatory1" },
      { name: "signatory2", github: "https://github.com/signatory2" },
    ],
  };

  const [showModal, setShowModal] = useState<boolean>(false);
  const [currentContributors] = useState<
    typeof bounty.contributer_signed
  >(bounty.contributer_signed);
  const [currentRequiredSigners, setCurrentRequiredSigners] = useState<
    string[]
  >(bounty.required_signatories);

  const handleSignClick = () => {
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const handleSign = () => {
    // Handle signing logic here (e.g., mark the required signer as signed)
    setCurrentRequiredSigners([]);
  };

  return (
    <div>
      <button
        onClick={handleSignClick}
        className="text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-semibold rounded-lg text-base px-6 py-3 transition duration-200 ease-in-out"
      >
        Sign
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
          <div className="bg-gray-900 text-white p-6 rounded-lg shadow-lg w-full max-w-xl max-h-[80vh] overflow-y-auto">
            <h4 className="font-semibold text-xl mb-4 text-center">
              Signers Information
            </h4>

            <div className="flex flex-col space-y-4">
              {/* Contributors Section */}
              <div className="bg-gray-800 p-4 rounded-lg shadow-md">
                <h5 className="font-semibold text-lg mb-2">
                  Contributors who signed:
                </h5>
                <ul className="mb-4">
                  {currentContributors.length > 0 ? (
                    currentContributors.map((contributor, index) => (
                      <li
                        key={index}
                        className="transition duration-200 ease-in-out transform hover:scale-105 mb-2"
                      >
                        <a
                          href={contributor.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline"
                        >
                          {contributor.github}
                        </a>
                      </li>
                    ))
                  ) : (
                    <li>No contributors have signed yet.</li>
                  )}
                </ul>
              </div>

              {/* Required Signers Section */}
              <div className="bg-gray-800 p-4 rounded-lg shadow-md">
                <h5 className="font-semibold text-lg mb-2">
                  Required signers yet to sign:
                </h5>
                <ul>
                  {currentRequiredSigners.length > 0 ? (
                    currentRequiredSigners.map((signer, index) => (
                      <li key={index}>{signer}</li>
                    ))
                  ) : (
                    <li>All required signers have signed.</li>
                  )}
                </ul>
              </div>
            </div>

            <div className="flex flex-col mt-4">
              <button
                className="w-full mb-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition duration-200"
                onClick={handleSign}
              >
                Sign
              </button>

              <button
                className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition duration-200"
                onClick={closeModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sign;
