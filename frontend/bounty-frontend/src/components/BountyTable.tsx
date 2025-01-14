import React, { useState } from "react";
import CreateBountyToken from "./CreateBountyToken";
import { useWallet } from "@meshsdk/react";
import CreateIDToken from "./CreateIDToken";
import SearchBars from "./SearchBar";
interface Bounty {
  name: string;
  tasks: string;
  reward: string;
}

const BountyTable: React.FC = () => {
  const { connected } = useWallet();

  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  // const [hasIDToken, setHasIDToken] = useState(false);

  const handleCreateBounty = (newBounty: Bounty) => {
    setBounties((prevState) => [...prevState, newBounty]);
  };

  const handleRowsPerPageChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setRowsPerPage(Number(event.target.value));
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(bounties.length / rowsPerPage);
  const displayedBounties = bounties.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <div className="mx-auto max-w-full px-4 sm:px-6 lg:px-8 mt-8 w-full text-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Bounty Board</h2>
        <div className="flex space-x-2">
          <CreateIDToken />
          {connected  &&(
            <CreateBountyToken onCreateBounty={handleCreateBounty} />
          )}
        </div>
      </div>

      <SearchBars />

      <div className="overflow-y-auto h-96">
        <table className="min-w-full divide-y divide-gray-600 border border-gray-600 mt-4">
          <thead>
            <tr>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-300 uppercase tracking-wider border-b border-gray-600">
                Creator
              </th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-300 uppercase tracking-wider border-b border-gray-600">
                Tasks
              </th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-300 uppercase tracking-wider border-b border-gray-600">
                Reward
              </th>
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-600">
            {displayedBounties.length === 0 ? (
              <tr>
                <td
                  className="px-6 py-4 text-sm text-gray-400 text-center"
                  colSpan={3}
                >
                  No bounties available
                </td>
              </tr>
            ) : (
              displayedBounties.map((bounty, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 border-b border-gray-600">
                    {bounty.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 border-b border-gray-600">
                    {bounty.tasks}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 border-b border-gray-600">
                    {bounty.reward}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center">
            <label className="text-gray-300" htmlFor="rows-per-page">
              Show:
            </label>
            <select
              id="rows-per-page"
              value={rowsPerPage}
              onChange={handleRowsPerPageChange}
              className="ml-2 bg-gray-700 text-white rounded px-2"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
            </select>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setCurrentPage((curr) => Math.max(1, curr - 1))}
              disabled={currentPage === 1}
              className="text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-full text-sm px-4 py-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700"
            >
              Previous
            </button>
            <span className="text-gray-300">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() =>
                setCurrentPage((curr) => Math.min(totalPages, curr + 1))
              }
              disabled={currentPage === totalPages}
              className="text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-full text-sm px-4 py-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BountyTable;
