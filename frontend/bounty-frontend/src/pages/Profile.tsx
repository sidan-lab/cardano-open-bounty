import { CardanoWallet } from "@meshsdk/react";
import { useWallet } from "@meshsdk/react";
import React, { useEffect, useState } from "react";
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import Footer from "@/components/Footer";

const Profile: React.FC = () => {
  const basenavigation = [
    { name: "Home", href: "./#", current: false },
    { name: "About", href: "./About", current: false },
  ];
  const { wallet, connected, connect } = useWallet();

  const navigation = [
    ...basenavigation,
    ...(connected
      ? [{ name: "Profile", href: "./Profile", current: true }]
      : []),
  ];

  const [, setUserBalance] = useState("");
  const [userToken, setUserToken] = useState<string | null>(null);
  const [userContributions, setUserContributions] = useState<number>(0);
  const [userGithubUrl, setUserGithubUrl] = useState<string | null>(null);

  function classNames(...classes: unknown[]) {
    return classes.filter(Boolean).join(" ");
  }
  const userBountyTokensContributed = [
    { id: 7, title: "Contributed Bounty Token 1", amount: 50 },
    { id: 8, title: "Contributed Bounty Token 2", amount: 25 },
    { id: 9, title: "Contributed Bounty Token 3", amount: 100 },
    { id: 10, title: "Contributed Bounty Token 4", amount: 75 },
  ];

  const totalAmount = userBountyTokensContributed.reduce(
    (total, token) => total + token.amount,
    0
  );

  useEffect(() => {
    const getWalletBalance = async () => {
      const balance = await wallet.getLovelace();
      setUserBalance(balance);

      // Simulating fetching user token and contributions
      setUserToken("ExampleIDToken");
      setUserContributions(3);
      setUserGithubUrl("https://github.com/exampleUser");
    };

    if (connected) {
      getWalletBalance();
    } else {
      connect("eternl");
    }
  }, [connect, connected, wallet]);

  return (
    <div className="bg-gray-900 w-full text-white text-center">
      <main className={`flex min-h-screen flex-col`}>
        <Disclosure as="nav" className="bg-gray-800 w-full shadow-lg">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="relative flex h-16 items-center justify-between">
              <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
                <DisclosureButton className="group relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white transition duration-150">
                  <span className="sr-only">Open main menu</span>
                  <Bars3Icon
                    aria-hidden="true"
                    className="block h-6 w-6 group-open:hidden"
                  />
                  <XMarkIcon
                    aria-hidden="true"
                    className="hidden h-6 w-6 group-open:block"
                  />
                </DisclosureButton>
              </div>

              <div className="flex flex-wrap items-center justify-between w-full">
                <div className="hidden sm:block">
                  <div className="flex space-x-4">
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        aria-current={item.current ? "page" : undefined}
                        className={classNames(
                          item.current
                            ? "bg-blue-600 text-white font-bold shadow-lg rounded-lg text-lg px-4 py-2 transition duration-200 ease-in-out"
                            : "text-gray-300 hover:bg-gray-700 hover:text-white font-medium transition duration-200 ease-in-out rounded-lg text-lg px-4 py-2"
                        )}
                      >
                        {item.name}
                      </Link>
                    ))}

                    <button className="text-white bg-gray-800 hover:bg-gray-700 rounded-lg text-lg px-4 py-2">
                      Admin
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-6 justify-end ml-auto">
                  <CardanoWallet />
                </div>
              </div>
            </div>
          </div>
          <DisclosurePanel className="sm:hidden">
            <div className="space-y-1 px-2 pb-3 pt-2">
              {navigation.map((item) => (
                <DisclosureButton
                  key={item.name}
                  as="a"
                  href={item.href}
                  aria-current={item.current ? "page" : undefined}
                  className={classNames(
                    item.current
                      ? "bg-gray-900 text-white font-bold"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white",
                    "block rounded-md px-4 py-2 text-base font-medium"
                  )}
                >
                  {item.name}
                </DisclosureButton>
              ))}
            </div>
          </DisclosurePanel>
        </Disclosure>

        <div className="bg-gray-900 w-full py-6 px-4">
          <main className="flex flex-col items-center">
            <h1 className="text-4xl font-extrabold mb-6">
              Profile Information
            </h1>
            <div className="bg-gray-800 rounded-lg shadow-lg p-8 w-full max-w-2xl">
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">User Details</h2>
                <p className="text-sm text-gray-300 mt-1">
                  ID Token:{" "}
                  <span className="font-medium">{userToken || "None"}</span>
                </p>
                <p className="text-sm text-gray-300">
                  GitHub URL:{" "}
                  {userGithubUrl ? (
                    <a
                      href={userGithubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      {userGithubUrl}
                    </a>
                  ) : (
                    <span className="font-medium">None</span>
                  )}
                </p>
              </div>

              <div className="bg-gray-700 rounded-lg">
                <h2 className="text-2xl font-bold sticky top-0 bg-gray-700 z-10 p-4">
                  Bounty Tokens Contributed
                </h2>
                <div className="h-48 overflow-y-auto p-4">
                  <ul className="space-y-4">
                    {userBountyTokensContributed.map((token) => (
                      <li
                        key={token.id}
                        className="border border-gray-600 p-4 rounded-lg flex justify-between items-center hover:bg-gray-600 transition duration-200"
                      >
                        <div>
                          <h3 className="text-lg font-semibold">
                            {token.title}
                          </h3>
                          <p className="text-sm text-gray-400">
                            Amount: {token.amount}
                          </p>
                        </div>
                        <span className="text-sm text-gray-300">
                          ID: {token.id}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </main>
        </div>
        <Footer />
      </main>
    </div>
  );
};

export default Profile;
