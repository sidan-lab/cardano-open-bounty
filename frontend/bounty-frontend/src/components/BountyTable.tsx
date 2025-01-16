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
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [hasIDToken, setHasIDToken] = useState(false);

  const handleCreateBounty = (newBounty: Bounty) => {
    setBounties((prevState) => [...prevState, newBounty]);
  };

  const handleRowsPerPageChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setRowsPerPage(Number(event.target.value));
    setCurrentPage(1);
  };

  const filteredBounties = bounties.filter(
    (bounty) =>
      bounty.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bounty.tasks.toLowerCase().includes(searchQuery.toLowerCase())
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
        <h2 className="text-4xl font-bold dark:text-white">Bounty Board</h2>
        <div className="flex space-x-2">
          <CreateIDToken />
          {connected && hasIDToken && (
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
          <SearchBars onSearchChange={handleSearchChange} />
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
                    type="button"
                    className="text-white bg-text-white bg-gray-800 hover:bg-[#050708]/80 focus:ring-4 focus:outline-none focus:ring-[#050708]/50 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:hover:bg-[#050708]/40 dark:focus:ring-gray-600 me-2 mb-2"
                  >
                    <svg
                      width="32"
                      height="32"
                      clip-rule="evenodd"
                      fill-rule="evenodd"
                      stroke-linejoin="round"
                      stroke-miterlimit="2"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="m21 4.009c0-.478-.379-1-1-1h-16c-.62 0-1 .519-1 1v16c0 .621.52 1 1 1h16c.478 0 1-.379 1-1zm-16.5.5h15v15h-15zm2.449 7.882 3.851 3.43c.142.128.321.19.499.19.202 0 .405-.081.552-.242l5.953-6.509c.131-.143.196-.323.196-.502 0-.41-.331-.747-.748-.747-.204 0-.405.082-.554.243l-5.453 5.962-3.298-2.938c-.144-.127-.321-.19-.499-.19-.415 0-.748.335-.748.746 0 .205.084.409.249.557z"
                        fill="#FFFFFF"
                      />
                    </svg>
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
