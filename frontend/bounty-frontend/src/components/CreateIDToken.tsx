import React, { useState, useEffect } from "react";
import { useWallet } from "@meshsdk/react";
// import { mintIdToken } from "@/pages/transactions/id_token_mint";

const CreateIDToken: React.FC = () => {
  const { wallet, connected } = useWallet();
  const [formVisible, setFormVisible] = useState(false);
  const [github, setGithub] = useState("");
  const [showMintPrompt, setShowMintPrompt] = useState(false);
  const [hasIDToken, setHasIDToken] = useState(false);

  useEffect(() => {
    const checkIDTokenOwnership = async () => {
      const tokenOwnership = false;

      if (!tokenOwnership) {
        setShowMintPrompt(true);
      } else {
        setHasIDToken(true);
      }
    };
    if (connected) {
      checkIDTokenOwnership();
    }
  }, [connected, wallet]);

  const handleMintIDToken = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      await console.log("Minted ID Token with GitHub URL:", github);

      setGithub("");
      setFormVisible(false);
    } catch (error) {
      console.error("Error minting ID token:", error);
    }
  };

  return (
    <div>
      {connected && (
        <button
          className="text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-full text-sm px-5 py-2.5 me-2 mb-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700"
          onClick={() => setFormVisible(true)}
        >
          Mint ID Token
        </button>
      )}

      {showMintPrompt && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg z-50 w-1/3">
            <h2 className="text-lg font-bold text-gray-300">
              No ID Token Found
            </h2>
            <p className="text-gray-400 mt-2">
              Do you want to mint an ID token?
            </p>
            <div className="flex justify-center space-x-4 mt-4">
              <button
                className="text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-full text-sm px-5 py-2.5 transition duration-200 ease-in-out"
                onClick={() => setFormVisible(true)}
              >
                Yes
              </button>
              <button
                className="text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-full text-sm px-5 py-2.5 transition duration-200 ease-in-out"
                onClick={() => setShowMintPrompt(false)}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {formVisible && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300">
          <div className="bg-gray-800 p-8 rounded-lg shadow-lg z-50 w-1/3 transform transition-all duration-300 ease-in-out scale-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-300">Mint ID Token</h2>
              <button
                type="button"
                onClick={() => setFormVisible(false)}
                className="text-gray-400 hover:text-white transition-colors duration-200"
                aria-label="Close Modal"
              >
                <svg
                  className="w-5 h-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6  18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <form onSubmit={handleMintIDToken}>
              <div className="mb-4">
                <label
                  htmlFor="github"
                  className="block mb-2 text-sm font-medium text-gray-300"
                >
                  GitHub Account
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-e-0 border-gray-300 rounded-l-md dark:bg-gray-600 dark:text-gray-400 dark:border-gray-600">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    id="github"
                    value={github}
                    onChange={(e) => setGithub(e.target.value)}
                    className="rounded-none rounded-r-lg bg-gray-700 border border-gray-600 text-gray-300 focus:ring-blue-500 focus:border-blue-500 block flex-1 min-w-0 w-full text-sm p-2.5 dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400"
                    placeholder="Enter your GitHub URL..."
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 mb-2"
              >
                Mint Token
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateIDToken;
