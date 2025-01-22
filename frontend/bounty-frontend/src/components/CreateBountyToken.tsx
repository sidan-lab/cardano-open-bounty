import { mintBountyToken } from "@/transactions/bounty_token_mint";
import { useWallet } from "@meshsdk/react";
import React, { useEffect, useState } from "react";
// import { mintBountyToken } from "@/pages/transactions/bounty_token_mint";
// import { useWallet } from "@meshsdk/react";

interface Bounty {
  tasks: string;
  reward: number;
}

const CreateBountyToken: React.FC = () => {
  const [formVisible, setFormVisible] = useState(false);
  const [, setIsLoading] = useState(false);
  const { wallet, connected } = useWallet();
  const [newBounty, setNewBounty] = useState<Bounty>({
    tasks: "",
    reward: 100,
  });

  useEffect(() => {
    if (connected) {
    }
  }, [connected, wallet]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setNewBounty((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  // const handleSignatoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const value = e.target.value;

  //   const signatories = value.split(",").map((s) => s.trim());
  //   setNewBounty((prevState) => ({
  //     ...prevState,
  //     required_signatories: signatories,
  //   }));
  // };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    // async function performTransaction(): Promise<boolean> {
    //   const success = true;
    //   return success;
    // }

    // const transactionSuccessful = await performTransaction();
    setIsLoading(false);

    // if (transactionSuccessful) {
    // onCreateBounty(newBounty);
    setNewBounty({
      // name: newBounty.name,
      tasks: newBounty.tasks,
      reward: newBounty.reward,
      // required_signatories: newBounty.required_signatories,
    });
    try {
      await mintBountyToken(newBounty.tasks, newBounty.reward, wallet);
      console.log("Minted Bounty Token with issue URL:", newBounty.tasks);

      setNewBounty({
        // name: newBounty.name,
        tasks: "",
        reward: 100,
        // required_signatories: newBounty.required_signatories,
      });
      setFormVisible(false);
    } catch (error) {
      console.error("Error minting bounty token:", error);
    }
    // } else {
    //   console.error("Transaction failed");
    // }
  };

  return (
    <div>
      <button
        className="text-white bg-text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700"
        onClick={() => setFormVisible(true)}
      >
        Create Bounty Token
      </button>

      {formVisible && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-gray-800 p-10 rounded-lg shadow-lg w-1/2">
            <form onSubmit={handleSubmit}>
              <div className="flex items-center justify-center mb-6 relative">
                <h2 className="text-xl font-semibold text-gray-300 text-center flex-grow">
                  Create Bounty
                </h2>
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              {/* <div className="mb-4">
                <label
                  htmlFor="Bounty name"
                  className="block mb-2 text-sm font-medium text-gray-300"
                >
                  Bounty Name
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-e-0 border-gray-300 rounded-l-md dark:bg-gray-600 dark:text-gray-400 dark:border-gray-600">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12.943 17.721c.028.09.057.18.057.279 0 .551-.449 1-1 1s-1-.449-1-1 .449-1 1-1c.099 0 .189.03.279.057-.164.082-.279.247-.279.443 0 .276.224.5.5.5.196 0 .361-.115.443-.279zm2.057.279c0 .912-.418 1.721-1.062 2.271-.084-.159-.246-.271-.438-.271-.276 0-.5.224-.5.5 0 .108.042.203.1.285-.341.135-.711.215-1.1.215-1.654 0-3-1.346-3-3 0-.389.08-.758.215-1.1.082.058.177.1.285.1.276 0 .5-.224.5-.5 0-.192-.112-.354-.271-.438.55-.644 1.359-1.062 2.271-1.062 1.654 0 3 1.346 3 3zm-1 0c0-1.104-.896-2-2-2s-2 .896-2 2 .896 2 2 2 2-.896 2-2zm7 0v6h-18v-6c0-2.471.044-3.888 2.383-4.428 2.524-.583 5.016-1.104 3.818-3.313-3.549-6.548-1.013-10.259 2.799-10.259 3.737 0 6.338 3.575 2.799 10.259-1.162 2.196 1.238 2.718 3.818 3.313 2.399.554 2.383 1.957 2.383 4.428zm-14-1.5c0-.276-.224-.5-.5-.5s-.5.224-.5.5.224.5.5.5.5-.224.5-.5zm1 5c0-.276-.224-.5-.5-.5s-.5.224-.5.5.224.5.5.5.5-.224.5-.5zm8-3.5c0-2.209-1.791-4-4-4s-4 1.791-4 4 1.791 4 4 4 4-1.791 4-4zm2 .5c0-.276-.224-.5-.5-.5s-.5.224-.5.5.224.5.5.5.5-.224.5-.5z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    name="name"
                    value={newBounty.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Provide Project name + Task Name"
                    className="rounded-none rounded-r-lg bg-gray-700 border border-gray-600 text-gray-300 focus:ring-blue-500 focus:border-blue-500 block flex-1 min-w-0 w-full text-sm p-2.5 dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400"
                  />
                </div>
              </div> */}
              <div className="mb-4">
                <label
                  htmlFor="Bounty tasks"
                  className="block text-gray-300 text-sm font-medium mb-2"
                >
                  Tasks Details
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-e-0 border-gray-300 rounded-l-md dark:bg-gray-600 dark:text-gray-400 dark:border-gray-600">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                    >
                      <path d="M22 2v20h-20v-20h20zm2-2h-24v24h24v-24zm-4 7h-8v1h8v-1zm0 5h-8v1h8v-1zm0 5h-8v1h8v-1zm-10.516-11.304l-.71-.696-2.553 2.607-1.539-1.452-.698.71 2.25 2.135 3.25-3.304zm0 5l-.71-.696-2.552 2.607-1.539-1.452-.698.709 2.249 2.136 3.25-3.304zm0 5l-.71-.696-2.552 2.607-1.539-1.452-.698.709 2.249 2.136 3.25-3.304z" />
                    </svg>
                  </span>
                  <input
                    name="tasks"
                    value={newBounty.tasks}
                    onChange={handleInputChange}
                    required
                    placeholder="Provide tasks URL"
                    className="rounded-none rounded-r-lg bg-gray-700 border border-gray-600 text-gray-300 focus:ring-blue-500 focus:border-blue-500 block flex-1 min-w-0 w-full text-sm p-2.5 dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label
                  htmlFor="Bounty Reward"
                  className="block text-gray-300 text-sm font-medium mb-2"
                >
                  Reward
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-e-0 border-gray-300 rounded-l-md dark:bg-gray-600 dark:text-gray-400 dark:border-gray-600">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                    >
                      <path d="M17 12c-3.313 0-6 2.687-6 6s2.687 6 6 6 6-2.687 6-6-2.687-6-6-6zm.5 8.474v.526h-.5v-.499c-.518-.009-1.053-.132-1.5-.363l.228-.822c.478.186 1.114.383 1.612.27.574-.13.692-.721.057-1.005-.465-.217-1.889-.402-1.889-1.622 0-.681.52-1.292 1.492-1.425v-.534h.5v.509c.362.01.768.073 1.221.21l-.181.824c-.384-.135-.808-.257-1.222-.232-.744.043-.81.688-.29.958.856.402 1.972.7 1.972 1.773.001.858-.672 1.315-1.5 1.432zm1.624-10.179c1.132-.223 2.162-.626 2.876-1.197v.652c0 .499-.386.955-1.007 1.328-.581-.337-1.208-.6-1.869-.783zm-2.124-5.795c2.673 0 5-1.007 5-2.25s-2.327-2.25-5-2.25c-2.672 0-5 1.007-5 2.25s2.328 2.25 5 2.25zm.093-2.009c-.299-.09-1.214-.166-1.214-.675 0-.284.334-.537.958-.593v-.223h.321v.211c.234.005.494.03.784.09l-.116.342c-.221-.051-.467-.099-.708-.099l-.072.001c-.482.02-.521.287-.188.399.547.169 1.267.292 1.267.74 0 .357-.434.548-.967.596v.22h-.321v-.208c-.328-.003-.676-.056-.962-.152l.147-.343c.244.063.552.126.828.126l.208-.014c.369-.053.443-.3.035-.418zm-11.093 13.009c1.445 0 2.775-.301 3.705-.768.311-.69.714-1.329 1.198-1.899-.451-1.043-2.539-1.833-4.903-1.833-2.672 0-5 1.007-5 2.25s2.328 2.25 5 2.25zm.093-2.009c-.299-.09-1.214-.166-1.214-.675 0-.284.335-.537.958-.593v-.223h.321v.211c.234.005.494.03.784.09l-.117.342c-.22-.051-.466-.099-.707-.099l-.072.001c-.482.02-.52.287-.188.399.547.169 1.267.292 1.267.74 0 .357-.434.548-.967.596v.22h-.321v-.208c-.329-.003-.676-.056-.962-.152l.147-.343c.244.063.552.126.828.126l.208-.014c.368-.053.443-.3.035-.418zm4.003 8.531c-.919.59-2.44.978-4.096.978-2.672 0-5-1.007-5-2.25v-.652c1.146.918 3.109 1.402 5 1.402 1.236 0 2.499-.211 3.549-.611.153.394.336.773.547 1.133zm-9.096-3.772v-.651c1.146.917 3.109 1.401 5 1.401 1.039 0 2.094-.151 3.028-.435.033.469.107.926.218 1.37-.888.347-2.024.565-3.246.565-2.672 0-5-1.007-5-2.25zm0-2.5v-.652c1.146.918 3.109 1.402 5 1.402 1.127 0 2.275-.176 3.266-.509-.128.493-.21 1.002-.241 1.526-.854.298-1.903.483-3.025.483-2.672 0-5-1.007-5-2.25zm11-11v-.652c1.146.918 3.109 1.402 5 1.402 1.892 0 3.854-.484 5-1.402v.652c0 1.243-2.327 2.25-5 2.25-2.672 0-5-1.007-5-2.25zm0 5v-.652c.713.571 1.744.974 2.876 1.197-.661.183-1.287.446-1.868.783-.622-.373-1.008-.829-1.008-1.328zm0-2.5v-.651c1.146.917 3.109 1.401 5 1.401 1.892 0 3.854-.484 5-1.401v.651c0 1.243-2.327 2.25-5 2.25-2.672 0-5-1.007-5-2.25z" />
                    </svg>
                  </span>
                  <input
                    type="number"
                    name="reward"
                    value={newBounty.reward}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter reward amount "
                    className="rounded-none rounded-r-lg bg-gray-700 border border-gray-600 text-gray-300 focus:ring-blue-500 focus:border-blue-500 block flex-1 min-w-0 w-full text-sm p-2.5 dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400"
                    min="0"
                  />
                </div>
              </div>
              {/* <div className="mb-4">
                <label
                  htmlFor="signatories"
                  className="block text-gray-300 text-sm font-medium mb-2"
                >
                  Signatories
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-e-0 border-gray-300 rounded-l-md dark:bg-gray-600 dark:text-gray-400 dark:border-gray-600">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                    >
                      <path d="M13.473 9.196c-.425-.439-.401-1.127.035-1.552l4.461-4.326c.218-.211.498-.318.775-.318.282 0 .563.11.776.331l-6.047 5.865zm-7.334 11.021c-.092.089-.139.208-.139.327 0 .25.204.456.456.456.114 0 .229-.042.317-.128l.749-.729-.633-.654-.75.728zm6.33-8.425l-2.564 2.485c-1.378 1.336-2.081 2.63-2.73 4.437l1.132 1.169c1.825-.593 3.14-1.255 4.518-2.591l2.563-2.486-2.919-3.014zm7.477-7.659l-6.604 6.405 3.326 3.434 6.604-6.403c.485-.469.728-1.093.728-1.718 0-2.088-2.53-3.196-4.054-1.718zm-19.946 16.867h4v-1h-4v1z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    value={newBounty.required_signatories.join(",")}
                    onChange={handleSignatoryChange}
                    placeholder="Enter signatories (e.g., sign1, sign2, sign3)"
                    className="rounded-lg bg-gray-700 border border-gray-600 text-gray-300 focus:ring-blue-500 focus:border-blue-500 block w-full text-sm p-2.5"
                  />
                </div>
              </div> */}

              <button
                type="submit"
                className="text-white bg-gray-700 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 mb-2"
                onClick={() => {
                  // mintBountyToken(wallet);
                }}
              >
                Create Bounty
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateBountyToken;
