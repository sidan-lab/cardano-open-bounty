import React, { useState } from "react";
import { BountyWithName } from "@/services/type";
import { redeemBountyToken } from "@/transactions/bounty_token_redeem";
import { IWallet } from "@meshsdk/core";

interface ContributeProps {
  bounty: BountyWithName;
  wallet: IWallet;
  // bounty: {
  //   name: string;
  //   tasks: string;
  //   reward: string;
  //   required_signatories: string[];
  // };
}

const Contribute: React.FC<ContributeProps> = ({ bounty, wallet }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleContributeClick = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleConfirm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await redeemBountyToken(bounty, wallet);

      console.log(`User signed to contribute to ${bounty.name}`);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error minting bounty token:", error);
    }
  };

  return (
    <>
      <button
        type="button"
        className="text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-semibold rounded-lg text-base px-6 py-3 transition duration-200 ease-in-out"
        onClick={handleContributeClick}
      >
        Contribute
      </button>

      {isModalOpen && (
        <div
          id="crud-modal"
          tabIndex={-1}
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
          aria-hidden="true"
        >
          <div className="relative p-4 w-full max-w-md max-h-full">
            <div className="relative bg-gray-800 rounded-lg shadow dark:bg-gray-700">
              <div className="flex items-center justify-between p-4 border-b border-gray-600 rounded-t dark:border-gray-500">
                <h3 className="text-xl font-semibold text-gray-200">
                  Do You Want to Contribute?
                </h3>
                <button
                  type="button"
                  className="text-gray-400 bg-transparent hover:bg-gray-600 hover:text-white rounded-lg text-sm w-8 h-8"
                  onClick={handleCloseModal}
                >
                  <svg
                    className="w-3 h-3"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 14 14"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                    />
                  </svg>
                  <span className="sr-only">Close modal</span>
                </button>
              </div>
              <form className="p-4" onSubmit={handleConfirm}>
                <div className="mb-4 text-gray-300">
                  <div className="mb-2 flex items-center justify-center">
                    <label className="block text-sm font-medium mr-2">
                      Bounty:
                    </label>{" "}
                    <strong>{bounty.name}</strong>
                  </div>
                  <div className="mb-2 flex items-center justify-center">
                    <label className="block text-sm font-medium mr-2">
                      Task:
                    </label>
                    <a
                      href={bounty.issue_url}
                      className="text-blue-400 hover:underline"
                    >
                      {bounty.issue_url}
                    </a>
                  </div>
                  <div className="mb-2 flex items-center justify-center">
                    <label className="block text-sm font-medium mr-2">
                      Reward:
                    </label>{" "}
                    <span>{bounty.reward}</span>
                  </div>
                  {/* <div className="mb-4">
                    <label className="block text-sm font-medium">
                      Owners
                    </label>
                    <span>{bounty.required_signatories.join(", ")}</span>
                  </div> */}
                </div>

                <div className="mt-6 flex justify-center space-x-4">
                  <button
                    type="submit"
                    className="text-white inline-flex items-center bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5"
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    className="text-white bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-4 focus:ring-gray-500 font-medium rounded-lg text-sm px-5 py-2.5"
                    onClick={handleCloseModal}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Contribute;
