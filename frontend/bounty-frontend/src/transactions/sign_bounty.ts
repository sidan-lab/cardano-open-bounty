import { IWallet } from "@meshsdk/core";
import {
  deleteMultiSigApiRoute,
  getMultiSigApiRoute,
  updateMultiSigApiRoute,
} from "./api_common";

export const signBountyToken = async (
  bounty_name: string,
  contributor: string,
  wallet: IWallet
) => {
  if (!wallet) {
    alert("Please connect your wallet");
    return;
  }
  if (!process.env.NEXT_PUBLIC_BLOCKFROST_API_KEY) {
    alert("Please set up environment variables");
    return;
  }

  const usedAddress = (await wallet.getUsedAddresses())[0];

  try {
    const bountyResult = await getMultiSigApiRoute(bounty_name, contributor);

    const requiredSigners = bountyResult.requiredSigner;

    const indexToRemove = requiredSigners.indexOf(usedAddress);
    if (indexToRemove !== -1) {
      requiredSigners.splice(indexToRemove, 1);
      const signedTx = await wallet.signTx(bountyResult.signedTx, true);

      if (requiredSigners.length > 0) {
        await updateMultiSigApiRoute(
          bounty_name,
          signedTx,
          requiredSigners,
          contributor
        );
      } else {
        await wallet.submitTx(signedTx);
        await deleteMultiSigApiRoute(bounty_name);
      }
    } else {
      throw new Error("not a valid signer");
    }
  } catch (e) {
    console.error(e);
  }
};
