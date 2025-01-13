import React, { useState } from "react";
import CreateBountyToken from "./CreateBountyToken";
import { useWallet } from "@meshsdk/react";
import CreateIDToken from "./CreateIDToken";
import SearchBars from "./SearchBar";
interface Bounty {
  name: string;
  tasks: string;
  reward: string;
  contributions: string;
}

const BountyTable: React.FC = () => {
  const { connected } = useWallet();
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);

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
    <div className="mx-auto max-w-full px-4 sm:px-6 lg:px-8 mt-8 w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-300">Bounty Board</h2>
        <CreateIDToken />
        {connected && <CreateBountyToken onCreateBounty={handleCreateBounty} />}
      </div>
      <SearchBars />
      <div className="overflow-y-auto h-96">
        <table className="min-w-full divide-y divide-gray-600 border border-gray-600 mt-4">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b border-gray-600">
                Bounty Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b border-gray-600">
                Tasks
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b border-gray-600">
                Reward
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b border-gray-600">
                Contributions
              </th>
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-600">
            {displayedBounties.length === 0 ? (
              <tr>
                <td
                  className="px-6 py-4 text-sm text-gray-400 text-center"
                  colSpan={4}
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 border-b border-gray-600">
                    {bounty.contributions}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="mb-4">
          <label className="text-gray-300" htmlFor="rows-per-page">
            Show:
          </label>
          <select
            id="rows-per-page"
            value={rowsPerPage}
            onChange={handleRowsPerPageChange}
            className="ml-2 bg-gray-700 text-white rounded"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={15}>15</option>
          </select>
        </div>
        <div className="mt-4 flex justify-between">
          <button
            onClick={() => setCurrentPage((curr) => Math.max(1, curr - 1))}
            disabled={currentPage === 1}
            className="text-white bg-blue-600 hover:bg-blue-700 rounded px-3 py-1"
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
            className="text-white bg-blue-600 hover:bg-blue-700 rounded px-3 py-1"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default BountyTable;
