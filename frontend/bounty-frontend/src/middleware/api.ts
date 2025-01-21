import { CIP68_100, hexToString, IWallet } from "@meshsdk/core";
import { UserWalletService } from "@/services/walletServices";
import { BlockfrostService } from "@/services/blockfrostServices";
import { Contributor, GitHub } from "@/transactions/types";

export class ApiMiddleware {
  wallet: UserWalletService;
  blockFrost: BlockfrostService;

  findIdtoken = async (): Promise<{ hasIdToken: boolean }> => {
    try {
      const hasIdToken = await this.wallet.findIdtoken();

      return hasIdToken;
    } catch (error) {
      console.error("Error finding idToken:", error);
      throw error;
    }
  };

  getIdRefToken = async (): Promise<{
    policyId: string;
    refAssetName: string;
  }> => {
    try {
      const { policyId, assetName } = await this.wallet.getIdToken();

      const refAssetName = CIP68_100(assetName.slice(3));

      return { policyId, refAssetName };
    } catch (error) {
      console.error("Error getting id tx :", error);
      throw error;
    }
  };

  getIdNftTx = async (): Promise<{
    txHash: string;
    index: number;
  }> => {
    try {
      const { policyId, assetName } = await this.wallet.getIdToken();

      const { txHash, index } = await this.blockFrost.getIdTokenTxHash(
        policyId,
        assetName
      );

      return { txHash, index };
    } catch (error) {
      console.error("Error getting id tx :", error);
      throw error;
    }
  };

  getIdRefTx = async (): Promise<{
    txHash: string;
    index: number;
  }> => {
    try {
      const { policyId, assetName } = await this.wallet.getIdToken();

      const refAssetName = CIP68_100(assetName.slice(3));
      const { txHash, index } = await this.blockFrost.getIdRefTxHash(
        policyId,
        refAssetName
      );

      return { txHash, index };
    } catch (error) {
      console.error("Error getting id tx :", error);
      throw error;
    }
  };

  getIdInfo = async (): Promise<{
    tokenName: string;
    gitHub: string;
    contributions: Map<string, number>;
    tx_hash: string;
    outputIndex: number;
  }> => {
    try {
      const { policyId, assetName } = await this.wallet.getIdToken();

      const refAssetName = CIP68_100(assetName.slice(8));

      const { txHash, index } = await this.blockFrost.getIdRefTxHash(
        policyId,
        refAssetName
      );
      const contributor: Contributor = await this.blockFrost.getIdTokenDatum(
        txHash,
        index
      );

      const tx_hash: string = txHash;
      const outputIndex: number = index;
      const tokenName: string = hexToString(assetName.slice(8));
      const gitHub: string = contributor.metadata.get(GitHub)!;

      const contributions: Map<string, number> = contributor.contributions;
      return { tx_hash, outputIndex, tokenName, gitHub, contributions };
    } catch (error) {
      console.error("Error getting id info :", error);
      throw error;
    }
  };

  getOracleCounterNum = async (
    txHash: string,
    index: number
  ): Promise<{ count: number }> => {
    try {
      const { count } = await this.blockFrost.getOracleCounterDatumn(
        txHash,
        index
      );

      return { count };
    } catch (error) {
      console.error("Error fetching count:", error);
      throw error;
    }
  };

  constructor(wallet: IWallet) {
    this.wallet = new UserWalletService(wallet);
    this.blockFrost = new BlockfrostService();
  }
}
