import React, { useState } from "react";

interface Bounty {
  name: string;
  tasks: string;
  reward: string;
  contributions: string;
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
    contributions: "",
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
      contributions: "",
    });
    setFormVisible(false);
  };

  return (
    <div>
      <button
        className="text-white bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
        onClick={() => setFormVisible(true)}
      >
        Create Bounty Token
      </button>

      {formVisible && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-gray-800 p-8 rounded-lg shadow-lg z-50 w-1/2">
            <form onSubmit={handleSubmit}>
              <h2 className="text-lg font-bold text-gray-300 text-center mb-6">
                Create Bounty
              </h2>
              <button
                type="button"
                onClick={() => setFormVisible(false)}
                className="text-gray-300 hover:text-white absolute top-4 left-4"
              >
                &#x2190; Back
              </button>
              <div className="mb-4">
                <label className="block text-gray-300">Bounty Name</label>
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
                <label className="block text-gray-300">Tasks</label>
                <textarea
                  name="tasks"
                  value={newBounty.tasks}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full bg-gray-700 text-gray-300 rounded px-3 py-2"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-300">
                  Reward (ADA/Lovelace)
                </label>
                <input
                  type="number"
                  name="reward"
                  value={newBounty.reward}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full bg-gray-700 text-gray-300 rounded px-3 py-2"
                  min="0" // Setting minimum value to 0
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-300">
                  Contribution Point
                </label>
                <input
                  type="number"
                  name="contributions"
                  value={newBounty.contributions}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full bg-gray-700 text-gray-300 rounded px-3 py-2"
                />
              </div>
              <button
                type="submit"
                className="text-white bg-blue-600 hover:bg-blue-700 w-full py-2 rounded mt-4"
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
