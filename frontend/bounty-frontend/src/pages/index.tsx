import { CardanoWallet } from "@meshsdk/react";
import { useWallet } from "@meshsdk/react";
import React, { useEffect, useState } from "react";
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import BountyTable from "@/components/BountyTable";
import Link from "next/link";
import Footer from "@/components/Footer";
import { mintOracleCounter } from "@/transactions/mint_oracle_counter";
import { mintOracleNFT } from "@/transactions/mint_oracle_nft";
import { spendOracleNFT } from "@/transactions/spend_oracle_nft";

export default function Home() {
  const basenavigation = [
    { name: "Home", href: "#", current: true },
    { name: "About", href: "./About", current: false },
  ];
  function classNames(...classes: unknown[]) {
    return classes.filter(Boolean).join(" ");
  }

  const { wallet, connected, connect } = useWallet();

  const [, setUserBalance] = useState("");

  const navigation = [
    ...basenavigation,
    ...(connected
      ? [{ name: "Profile", href: "./Profile", current: false }]
      : []),
  ];
  useEffect(() => {
    const getWalletBalance = async () => {
      const balance = await wallet.getLovelace();
      setUserBalance(balance);
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
                            ? "bg-shadow text-blue-300 font-bold shadow-lg rounded-lg text-lg px-4 py-2"
                            : "text-white hover:bg-gray-700 hover:text-white font-medium transition duration-200 ease-in-out rounded-lg text-lg px-4 py-2"
                        )}
                      >
                        {item.name}
                      </Link>
                    ))}
                    <button
                      type="button"
                      className="text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-md px-5 py-2.5 me-2 mb-2 transition duration-200 ease-in-out"
                      onClick={() => {
                        if (!wallet) {
                          alert("Please connect wallet");
                          return;
                        }
                        mintOracleNFT(wallet);
                      }}
                    >
                      Oracle
                    </button>
                    <button
                      type="button"
                      className="text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-md px-5 py-2.5 me-2 mb-2 transition duration-200 ease-in-out"
                      onClick={() => {
                        if (!wallet) {
                          alert("Please connect wallet");
                          return;
                        }
                        mintOracleCounter(wallet);
                      }}
                    >
                      Counter
                    </button>
                    <button
                      type="button"
                      className="text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-md px-5 py-2.5 me-2 mb-2 transition duration-200 ease-in-out"
                      onClick={() => {
                        if (!wallet) {
                          alert("Please connect wallet");
                          return;
                        }
                        spendOracleNFT(wallet);
                      }}
                    >
                      Update
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

        <div className="flex-grow">
          <BountyTable />
        </div>
      </main>

      <Footer />
    </div>
  );
}
