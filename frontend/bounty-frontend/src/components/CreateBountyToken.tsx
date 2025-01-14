import React, { useState } from "react";

interface Bounty {
  name: string;
  tasks: string;
  reward: string;
}

interface CreateBountyTokenProps {
  onCreateBounty: (bounty: Bounty) => void;
}

const CreateBountyToken: React.FC<CreateBountyTokenProps> = ({
  onCreateBounty,
}) => {
  const [formVisible, setFormVisible] = useState(false);
  const [newBounty, setNewBounty] = useState<Bounty>({
    name: "",
    tasks: "",
    reward: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setNewBounty((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onCreateBounty(newBounty);
    setNewBounty({
      name: "",
      tasks: "",
      reward: "",
    });
    setFormVisible(false);
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
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-gray-800 p-8 rounded-lg shadow-lg z-50 w-1/2">
            <form onSubmit={handleSubmit}>
              <div className="flex items-center justify-center mb-6 relative">
                <button
                  type="button"
                  onClick={() => setFormVisible(false)}
                  className="text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-full text-sm px-5 py-2.5 me-2 mb-2 absolute left-0 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700"
                >
                  &#x2190; Back
                </button>
                <h2 className="text-lg font-bold text-gray-300 text-center flex-grow">
                  Create Bounty
                </h2>
              </div>
              <div className="mb-4">
                <label className="block text-gray-300">
                  Bounty name(Project name + Task name)
                </label>
                <input
                  type="text"
                  name="name"
                  value={newBounty.name}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full bg-gray-700 text-gray-300 rounded px-3 py-2"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-300">
                  Tasks Details(URL)
                </label>
                <textarea
                  name="tasks"
                  value={newBounty.tasks}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full bg-gray-700 text-gray-300 rounded px-3 py-2"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-300">Reward (ADA)</label>
                <input
                  type="number"
                  name="reward"
                  value={newBounty.reward}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full bg-gray-700 text-gray-300 rounded px-3 py-2"
                  min="0"
                />
              </div>

              <button
                type="submit"
                className="text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700"
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
