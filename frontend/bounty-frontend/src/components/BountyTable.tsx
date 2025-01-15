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

  const [bounties, setBounties] = useState<Bounty[]>([
    {
      name: "Project-A: Fix Bugs",
      tasks: "https://example.com/task1",
      reward: "50 ADA",
    },
    {
      name: "Project-A: Develop Feature X",
      tasks: "https://example.com/task2",
      reward: "75 ADA",
    },
    {
      name: "Project-A: Update Documentation",
      tasks: "https://example.com/task3",
      reward: "20 ADA",
    },
    {
      name: "Project-B: Conduct Security Audit",
      tasks: "https://example.com/task4",
      reward: "100 ADA",
    },
    {
      name: "Project-C: Design UI Mockup",
      tasks: "https://example.com/task5",
      reward: "30 ADA",
    },
    {
      name: "Project-D: Create Marketing Plan",
      tasks: "https://example.com/task6",
      reward: "60 ADA",
    },
    {
      name: "Project-D: Analyze User Feedback",
      tasks: "https://example.com/task7",
      reward: "40 ADA",
    },
    {
      name: "Project-E: Optimize Performance",
      tasks: "https://example.com/task8",
      reward: "80 ADA",
    },
    {
      name: "Project-F: Setup Continuous Integration",
      tasks: "https://example.com/task9",
      reward: "70 ADA",
    },
    {
      name: "Project-G: Develop API Endpoints",
      tasks: "https://example.com/task10",
      reward: "90 ADA",
    },
    {
      name: "Project-H: Migrate Database",
      tasks: "https://example.com/task11",
      reward: "110 ADA",
    },
    {
      name: "Project-I: Create User Stories",
      tasks: "https://example.com/task12",
      reward: "55 ADA",
    },
    {
      name: "Project-J: Write Unit Tests",
      tasks: "https://example.com/task13",
      reward: "65 ADA",
    },
    {
      name: "Project-K: Conduct Market Research",
      tasks: "https://example.com/task14",
      reward: "95 ADA",
    },
    {
      name: "Project-L: Implement Security Measures",
      tasks: "https://example.com/task15",
      reward: "125 ADA",
    },
  ]);

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
    <div className="relative overflow-x-auto shadow-md sm:rounded-lg mx-auto max-w-full px-4 sm:px-6 lg:px-8 mt-8 w-full text-white dark:bg-gray-900">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-4xl font-bold dark:text-white">Bounty Board</h2>
        <div className="flex space-x-2">
          <CreateIDToken />
          {connected && (
            <CreateBountyToken onCreateBounty={handleCreateBounty} />
          )}
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
          <SearchBars />
        </div>
      </div>

      <table className="w-full text-sm text-center rtl:text-right text-gray-500 dark:text-gray-400 mt-4 rounded-lg">
        <thead className="text-xs text-gray-300 uppercase bg-gray-800 rounded-lg">
          <tr>
            <th scope="col" className="px-6 py-3 text-white">
              Creator
            </th>
            <th scope="col" className="px-6 py-3 text-white">
              Tasks
            </th>
            <th scope="col" className="px-6 py-3 text-white">
              Reward
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
                className="bg-gray-900 border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-700 dark:hover:bg-gray-600"
              >
                <th
                  scope="row"
                  className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap text-white"
                >
                  {bounty.name}
                </th>
                <td className="px-6 py-4 text-white">
                  <a
                    href={bounty.tasks}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    {bounty.tasks}
                  </a>
                </td>
                <td className="px-6 py-4 text-white">{bounty.reward}</td>
                <td className="px-6 py-4">
                  <button
                    className="bg-green-500 text-white rounded px-4 py-2 hover:bg-green-600 transition"
                    onClick={() => alert(`Contributing to ${bounty.name}`)} // Replace with your contribution logic
                  >
                    Contribute
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="mt-4 flex items-center justify-center">
        {" "}
        {/* Centering the pagination controls */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setCurrentPage((curr) => Math.max(1, curr - 1))}
            disabled={currentPage === 1}
            className="text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-full text-sm px-4 py-2 transition"
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
