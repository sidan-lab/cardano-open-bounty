import { IWallet } from "@meshsdk/core";
import { getIdMintingPolicyId } from "@/transactions/common";

export class UserWalletService {
  wallet: IWallet;
  idMintingPolicyId: string;

  findIdtoken = async (): Promise<{ hasIdToken: boolean }> => {
    try {
      const userAsset = await this.wallet.getBalance();

      const hasIdToken = userAsset.some(
        (asset) => asset.unit.slice(0, 56) === this.idMintingPolicyId
      );

      return { hasIdToken };
    } catch (error) {
      console.error("Error finding idToken:", error);
      throw error;
    }
  };

  getIdToken = async (): Promise<{ policyId: string; assetName: string }> => {
    try {
      const idAsset = await this.wallet.getPolicyIdAssets(
        this.idMintingPolicyId
      );

      const policyId = idAsset[0].policyId;
      const assetName = idAsset[0].assetName;

      return { policyId, assetName };
    } catch (error) {
      console.error("Error geting idToken:", error);
      throw error;
    }
  };

  constructor(wallet: IWallet) {
    this.wallet = wallet;
    this.idMintingPolicyId = getIdMintingPolicyId();
  }
}
