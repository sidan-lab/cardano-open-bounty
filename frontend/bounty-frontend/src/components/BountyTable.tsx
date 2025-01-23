import React, { useEffect, useState } from "react";
import CreateBountyToken from "./CreateBountyToken";
import { useWallet } from "@meshsdk/react";
import CreateIDToken from "./CreateIDToken";
import SearchBars from "./SearchBar";
import { ApiMiddleware } from "@/middleware/api";
import Contribute from "./Contribute";
import Sign from "./Sign";
import { BountyWithName } from "@/services/type";
// interface Bounty {
//   name: string;
//   tasks: string;
//   reward: string;
//   // required_signatories: string[];
// }

const BountyTable: React.FC = () => {
  const { wallet, connected } = useWallet();
  const [showOwnBountyBoard, setShowOwnBountyBoard] = useState<boolean>(false);

  const [bounties, setBounties] = useState<BountyWithName[]>([]);
  const [userBounties, setUserBounties] = useState<BountyWithName[]>([]);

  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [hasIDToken, setHasIDToken] = useState(false);

  useEffect(() => {
    const checkIDTokenOwnership = async () => {
      const api = new ApiMiddleware(wallet);
      const allBounties: BountyWithName[] = await api.getAllBounty();
      const hasId = await api.findIdtoken();

      if (hasId.hasIdToken) {
        const { tokenName } = await api.getIdToken();
        const ownBounties: BountyWithName[] = allBounties.filter(
          (bounty) => bounty.name === tokenName
        );

        setUserBounties(ownBounties);
      }
      setBounties(allBounties);
      setHasIDToken(hasId.hasIdToken);
    };
    if (connected) {
      checkIDTokenOwnership();
    }
  }, [connected, wallet]);

  const toggleBountyBoard = () => {
    setShowOwnBountyBoard((prev) => !prev);
  };

  // const handleCreateBounty = (newBounty: Bounty) => {
  //   setBounties((prevState) => [...prevState, newBounty]);
  // };

  const handleRowsPerPageChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setRowsPerPage(Number(event.target.value));
    setCurrentPage(1);
  };

  const filteredBounties = bounties.filter(
    (bounty) =>
      bounty.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bounty.issue_url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bounty.reward.toString().includes(searchQuery)
  );

  const totalPages = Math.ceil(filteredBounties.length / rowsPerPage);

  const displayedBounties = filteredBounties.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  return (
    <div className="relative overflow-x-auto shadow-md sm:rounded-lg mx-auto max-w-full px-4 sm:px-6 lg:px-8 mt-8 w-full text-white dark:bg-gray-900">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-4xl font-bold ">
          {showOwnBountyBoard ? "Own Bounty Board" : "Bounty Board"}
        </h2>
        <button
          className="text-white bg-text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700"
          onClick={toggleBountyBoard}
        >
          {showOwnBountyBoard ? " Show Bounty Board" : "Show own Bounty Board"}
        </button>
        <div className="flex space-x-2">
          {!hasIDToken && <CreateIDToken />}
          {true && true && <CreateBountyToken />}
        </div>
      </div>

      <div className="flex justify-between items-center mb-4 rounded-lg">
        <div className="flex items-center">
          <label className="text-gray-300" htmlFor="rows-per-page">
            Show:
          </label>
          <select
            id="rows-per-page"
            value={rowsPerPage}
            onChange={handleRowsPerPageChange}
            className="ml-2 bg-gray-700 text-white rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={15}>15</option>
          </select>
        </div>
        <div className="w-1/4">
          <SearchBars onSearchChange={handleSearchChange} />
        </div>
      </div>

      {showOwnBountyBoard ? (
        <>
          <table className="w-full text-sm text-center rtl:text-right text-gray-500 dark:text-gray-400 mt-4 rounded-lg">
            <thead className="text-xs text-gray-300 uppercase bg-gray-800">
              <tr>
                <th className="w-1/4 px-6 py-3 text-white font-semibold text-base">
                  Creator
                </th>
                <th className="w-1/2px-6 py-3 text-white font-semibold text-base">
                  Tasks
                </th>
                <th className="w-1/4 px-6 py-3 text-white font-semibold text-base">
                  Reward
                </th>
                <th className="w-1/4 px-6 py-3 text-white font-semibold text-base">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {userBounties.length === 0 ? (
                <tr className="bg-gray-900">
                  <td
                    className="px-6 py-4 text-sm text-gray-400 text-center"
                    colSpan={4}
                  >
                    No created bounties available
                  </td>
                </tr>
              ) : (
                userBounties.map((bounty, index) => (
                  <tr
                    key={index}
                    className="bg-gray-900 dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-700"
                  >
                    <th
                      scope="row"
                      className="px-6 py-4 font-medium text-white whitespace-nowrap"
                    >
                      {bounty.name}
                    </th>
                    <td className="px-6 py-4 text-white">
                      <a
                        href={bounty.issue_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline"
                      >
                        {bounty.issue_url}
                      </a>
                    </td>
                    <td className="px-6 py-4 text-white">{`${bounty.reward} ADA`}</td>
                    <td className="px-8 py-4 flex justify-center space-x-4">
                      <Sign bounty={bounty} wallet={wallet} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </>
      ) : (
        <table className="w-full text-sm text-center rtl:text-right text-gray-500 dark:text-gray-400 mt-4 rounded-lg">
          <thead className="text-xs text-gray-300 uppercase bg-gray-800">
            <tr>
              <th className="w-1/4 px-6 py-3 text-white font-semibold text-base">
                Creator
              </th>
              <th className="w-1/2px-6 py-3 text-white font-semibold text-base">
                Tasks
              </th>
              <th className="w-1/4 px-6 py-3 text-white font-semibold text-base">
                Reward
              </th>
              <th className="w-1/4 px-6 py-3 text-white font-semibold text-base">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {displayedBounties.length === 0 ? (
              <tr className="bg-gray-900">
                <td
                  className="px-6 py-4 text-sm text-gray-400 text-center"
                  colSpan={4}
                >
                  No bounties available
                </td>
              </tr>
            ) : (
              displayedBounties.map((bounty, index) => (
                <tr
                  key={index}
                  className="bg-gray-900 dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-700 dark:hover:bg-gray-600"
                >
                  <th
                    scope="row"
                    className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap text-white"
                  >
                    {bounty.name}
                  </th>
                  <td className="px-6 py-4 text-white">
                    <a
                      href={bounty.issue_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      {bounty.issue_url}
                    </a>
                  </td>
                  <td className="px-6 py-4 text-white">{`${bounty.reward} ADA`}</td>
                  <td className="px-8 py-4 flex justify-center space-x-4">
                    <Contribute bounty={bounty} wallet={wallet} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
      <div className="mt-4 flex items-center justify-center">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setCurrentPage((curr) => Math.max(1, curr - 1))}
            disabled={currentPage === 1}
            className="text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-full text-sm px-4 py-2 transition"
          >
            Previous
          </button>
          <span className="text-gray-300">
            Page {currentPage} of{" "}
            {showOwnBountyBoard
              ? Math.ceil(userBounties.length / rowsPerPage)
              : Math.ceil(bounties.length / rowsPerPage)}
          </span>
          <button
            onClick={() =>
              setCurrentPage((curr) => Math.min(totalPages, curr + 1))
            }
            disabled={
              currentPage ===
              (showOwnBountyBoard
                ? Math.ceil(userBounties.length / rowsPerPage)
                : Math.ceil(bounties.length / rowsPerPage))
            }
            className="text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-full text-sm px-4 py-2 transition"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default BountyTable;
