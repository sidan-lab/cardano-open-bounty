import React, { useEffect, useState } from "react";
import CreateBountyToken from "./CreateBountyToken";
import { useWallet } from "@meshsdk/react";
import CreateIDToken from "./CreateIDToken";
import SearchBars from "./SearchBar";
import { ApiMiddleware } from "@/middleware/api";
import Contribute from "./Contribute";
interface Bounty {
  name: string;
  tasks: string;
  reward: string;
  required_signatories: string[];
}

const BountyTable: React.FC = () => {
  const { wallet, connected } = useWallet();
  const api = new ApiMiddleware(wallet);

  const [bounties, setBounties] = useState<Bounty[]>([
    {
      name: "Project-A: Fix Bugs",
      tasks: "https://example.com/task1",
      reward: "50 ADA",
      required_signatories: ["signatory1", "signatory2"],
    },
    {
      name: "Project-A: Develop Feature X",
      tasks: "https://example.com/task2",
      reward: "75 ADA",
      required_signatories: ["signatory1", "signatory2", "signatory3"],
    },
    {
      name: "Project-A: Update Documentation",
      tasks: "https://example.com/task3",
      reward: "20 ADA",
      required_signatories: ["signatory1", "signatory2", "signatory3"],
    },
    {
      name: "Project-B: Conduct Security Audit",
      tasks: "https://example.com/task4",
      reward: "100 ADA",
      required_signatories: ["signatory1", "signatory2", "signatory3"],
    },
    {
      name: "Project-C: Design UI Mockup",
      tasks: "https://example.com/task5",
      reward: "30 ADA",
      required_signatories: ["signatory1", "signatory2", "signatory3"],
    },
    {
      name: "Project-D: Create Marketing Plan",
      tasks: "https://example.com/task6",
      reward: "60 ADA",
      required_signatories: ["signatory1", "signatory2", "signatory3"],
    },
    {
      name: "Project-D: Analyze User Feedback",
      tasks: "https://example.com/task7",
      reward: "40 ADA",
      required_signatories: ["signatory1", "signatory2", "signatory3"],
    },
    {
      name: "Project-E: Optimize Performance",
      tasks: "https://example.com/task8",
      reward: "80 ADA",
      required_signatories: ["signatory1"],
    },
    {
      name: "Project-F: Setup Continuous Integration",
      tasks: "https://example.com/task9",
      reward: "70 ADA",
      required_signatories: ["signatory1", "signatory2", "signatory3"],
    },
    {
      name: "Project-G: Develop API Endpoints",
      tasks: "https://example.com/task10",
      reward: "90 ADA",
      required_signatories: [
        "signatory1",
        "signatory2",
        "signatory3",
        "signtory4",
      ],
    },
    {
      name: "Project-H: Migrate Database",
      tasks: "https://example.com/task11",
      reward: "110 ADA",
      required_signatories: ["signatory1", "signatory2", "signatory3"],
    },
    {
      name: "Project-I: Create User Stories",
      tasks: "https://example.com/task12",
      reward: "55 ADA",
      required_signatories: ["signatory1", "signatory2", "signatory3"],
    },
    {
      name: "Project-J: Write Unit Tests",
      tasks: "https://example.com/task13",
      reward: "65 ADA",
      required_signatories: ["signatory1", "signatory2", "signatory3"],
    },
    {
      name: "Project-K: Conduct Market Research",
      tasks: "https://example.com/task14",
      reward: "95 ADA",
      required_signatories: ["signatory1", "signatory2"],
    },
    {
      name: "Project-L: Implement Security Measures",
      tasks: "https://example.com/task15",
      reward: "125 ADA",
      required_signatories: ["signatory1", "signatory2", "signatory3"],
    },
  ]);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [hasIDToken, setHasIDToken] = useState(false);

  useEffect(() => {
    const checkIDTokenOwnership = async () => {
      const hasId = await api.findIdtoken();
      setHasIDToken(hasId.hasIdToken);
    };
    if (connected) {
      checkIDTokenOwnership();
    }
  }, [connected, wallet]);

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
      bounty.tasks.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bounty.reward.includes(searchQuery)
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
          {!hasIDToken && <CreateIDToken />}
          
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
                  <Contribute bounty={bounty}></Contribute>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="mt-4 flex items-center justify-center">
        {" "}
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
