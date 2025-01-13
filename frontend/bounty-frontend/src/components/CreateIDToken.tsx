import React, { useState, useEffect } from "react";
import { useWallet } from "@meshsdk/react";
import {
  Transaction,
  ForgeScript,
  BlockfrostProvider,
  resolveTxHash,
} from "@meshsdk/core";
import { env } from "process";

export const blockfrost_api_key = process.env.BLOCKFROST_API_KEY || "";
const blockchainProvider = new BlockfrostProvider(blockfrost_api_key);

const CreateIDToken: React.FC = () => {
  const { wallet, connected } = useWallet();
  const [formVisible, setFormVisible] = useState(false);
  const [idTokenName, setIdTokenName] = useState("");
  const [showMintPrompt, setShowMintPrompt] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
      console.log("Minting ID Token: ", idTokenName);
      setIdTokenName("");
      setFormVisible(false);
    } catch (error) {
      console.error("Error minting ID token:", error);
    }
  };

  return (
    <div>
      {connected && (
        <button
          className="text-white bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
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
            <p className="text-gray-400">Do you want to mint an ID token?</p>
            <div className="flex justify-between mt-4">
              <button
                className="text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
                onClick={() => setFormVisible(true)}
              >
                Yes
              </button>
              <button
                className="text-gray-300 hover:text-white"
                onClick={() => setShowMintPrompt(false)}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Minting form */}
      {formVisible && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg z-50 w-1/2">
            <h2 className="text-lg font-bold text-gray-300 mb-4">
              Mint ID Token
            </h2>
            <form onSubmit={handleMintIDToken}>
              <div className="mb-4">
                <label className="block text-gray-300">ID Token Name</label>
                <input
                  type="text"
                  value={idTokenName}
                  onChange={(e) => setIdTokenName(e.target.value)}
                  required
                  className="mt-1 block w-full bg-gray-700 text-gray-300 rounded px-3 py-2"
                />
              </div>
              <button
                type="submit"
                className="text-white bg-blue-600 hover:bg-blue-700 w-full py-2 rounded"
              >
                Mint Token
              </button>
              <button
                type="button"
                onClick={() => setFormVisible(false)}
                className="mt-2 text-gray-300 hover:text-white"
              >
                &#x2190; Back
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateIDToken;
