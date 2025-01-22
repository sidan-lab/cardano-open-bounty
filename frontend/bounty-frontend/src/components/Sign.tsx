import { getUnsignedBountyApiRoute } from "@/pages/common/api_common";
import { ContributorRedeemed } from "@/pages/common/type";
import { BountyWithName } from "@/services/type";
import { signBountyToken } from "@/transactions/sign_bounty";
import { IWallet } from "@meshsdk/core";
import React, { useEffect, useState } from "react";

type HandleSignFunction = (unsignedTx: string, wallet: IWallet) => void;

const Sign: React.FC<{ bounty: BountyWithName; wallet: IWallet }> = ({
  bounty,
  wallet,
}) => {
  const contributors: ContributorRedeemed[] = [
    {
      bountyName: "Alice",
      gitHub: "https://github.com/alice/",
      contributions: new Map([
        ["mesh", 100],
        ["sidan", 200],
      ]),
      unsignedTx: "0xa",
      txHash: "0xa",
      outputIndex: 0,
    },
    {
      bountyName: "Bob",
      gitHub: "https://github.com/bob/",
      contributions: new Map([
        ["mesh", 100],
        ["sidan", 200],
      ]),
      unsignedTx: "0xa",
      txHash: "0xa",
      outputIndex: 0,
    },
    {
      bountyName: "Bob",
      gitHub: "https://github.com/bob/",
      contributions: new Map([
        ["mesh", 100],
        ["sidan", 200],
      ]),
      unsignedTx: "0xa",
      txHash: "0xa",
      outputIndex: 0,
    },
    {
      bountyName: "Bob",
      gitHub: "https://github.com/bob/",
      contributions: new Map([
        ["mesh", 100],
        ["sidan", 200],
      ]),
      unsignedTx: "0xa",
      txHash: "0xa",
      outputIndex: 0,
    },
  ];

  useEffect(() => {
    const fetchData = async () => {
      const contributorsRedeemed: ContributorRedeemed[] =
        await getUnsignedBountyApiRoute(bounty.txHash, bounty.outputIndex);
    };
    try {
      fetchData();
    } catch (error) {
      console.error("Error getting unsigned bounty token:", error);
    }
  }, []);

  const [showModal, setShowModal] = useState<boolean>(false);
  const [currentContributors] = useState<typeof contributors>(contributors);
  // const [currentRequiredSigners, setCurrentRequiredSigners] = useState<
  //   string[]
  // >(bounty.required_signatories);

  const handleSignShowClick = () => {
    setShowModal(true);
  };

  const handleSignClick = (unsignedTx: string, wallet: IWallet) => {
    return (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      handleSign(unsignedTx, wallet);
    };
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const handleSign: HandleSignFunction = async (
    unsignedTx: string,
    wallet: IWallet
  ) => {
    try {
      await signBountyToken(unsignedTx, wallet);
      setShowModal(false);

      console.log("Signed Bounty Token:", bounty.name);
    } catch (error) {
      console.error("Error signing bounty token:", error);
    }
  };

  return (
    <div>
      <button
        onClick={handleSignShowClick}
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
                  Contributors who want to Redeem:
                </h5>
                <ul className="mb-4 max-h-40 overflow-y-auto">
                  {currentContributors.length > 0 ? (
                    renderContributors(
                      currentContributors,
                      wallet,
                      handleSignClick
                    )
                  ) : (
                    <li>No contributors to display.</li>
                  )}
                </ul>
              </div>

              {/* Required Signers Section */}
              {/* <div className="bg-gray-800 p-4 rounded-lg shadow-md">
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
              </div> */}
            </div>

            <div className="flex flex-col mt-4">
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

function renderContributors(
  contributors: ContributorRedeemed[],
  wallet: IWallet,
  handleSignClick: (
    unsignedTx: string,
    wallet: IWallet
  ) => React.MouseEventHandler<HTMLButtonElement>
) {
  return contributors.map((contributor, index) => (
    <li
      key={index}
      className="transition duration-200 ease-in-out transform mb-2"
    >
      <div className="grid grid-cols-4">
        <span className="mr-2">{contributor.bountyName}</span>
        <a
          href={contributor.gitHub}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:underline break-words"
        >
          ({contributor.gitHub})
        </a>
        <div>
          <h6 className="font-semibold text-sm">Contributions:</h6>
          <ul>
            {Array.from(contributor.contributions).map(([repo, reward], i) => (
              <li key={i} className="text-sm">
                <span className="font-medium">{repo}:</span> {reward}
              </li>
            ))}
          </ul>
        </div>
        <button
          className="w-full mb-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition duration-200"
          onClick={handleSignClick(contributor.unsignedTx, wallet)}
        >
          Sign
        </button>
      </div>
    </li>
  ));
}

export default Sign;
