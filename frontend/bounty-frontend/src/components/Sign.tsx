import React, { useState } from "react";

const Sign: React.FC = () => {
  const bounty = {
    name: "Project-A: Fix Bugs",
    required_signatories: ["signatory1", "signatory2", "signatory3"],
    Contributer_signed: [
      { name: "signatory1", github: "https://github.com/signatory1" },
      { name: "signatory2", github: "https://github.com/signatory2" },
    ], 
  };

  const [showModal, setShowModal] = useState<boolean>(false);
  const [currentContributors, setCurrentContributors] = useState<
    typeof bounty.signed_by_contributors
  >(bounty.signed_by_contributors);
  const [currentRequiredSigners, setCurrentRequiredSigners] = useState<
    string[]
  >(bounty.required_signatories);

  const handleSignClick = () => {
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const handleFinalSign = () => {
    // Handle signing logic here (e.g., mark the required signer as signed)
    // Just for demonstration, we can clear the required signers
    setCurrentRequiredSigners([]);
  };

  return (
    <div>
      <button
        onClick={handleSignClick}
        className="text-blue-500 hover:underline"
      >
        Sign
      </button>

      {/* Pop-up Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-gray-800 text-white p-4 rounded-lg w-1/3">
            <h4 className="font-semibold text-lg mb-2">Signers Information</h4>

            <h5 className="font-semibold">Contributors who signed:</h5>
            <ul className="mb-4">
              {currentContributors.length > 0 ? (
                currentContributors.map((contributor, index) => (
                  <li key={index} className="ml-4">
                    <a
                      href={contributor.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      {contributor.name}
                    </a>
                  </li>
                ))
              ) : (
                <li className="ml-4">No contributors have signed yet.</li>
              )}
            </ul>

            <h5 className="font-semibold">Required signers yet to sign:</h5>
            <ul>
              {currentRequiredSigners.length > 0 ? (
                currentRequiredSigners.map((signer, index) => (
                  <li key={index} className="ml-4">
                    {signer}
                  </li>
                ))
              ) : (
                <li className="ml-4">All required signers have signed.</li>
              )}
            </ul>

            <button
              className="mt-4 px-4 py-2 bg-green-500 text-white rounded"
              onClick={handleFinalSign} // This will be called to simulate completing the signing process
            >
              Sign
            </button>

            <button
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
              onClick={closeModal}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sign;
