import { CIP68_100, IWallet } from "@meshsdk/core";
import { UserWalletService } from "@/services/walletServices";
import { BlockfrostService } from "@/services/blockfrostServices";
import { Contribution } from "@/services/type";

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

  getIdInfo = async (
    tx_hash: string | null,
    outputIndex: number | null
  ): Promise<{
    gitHub: string;
    contributions: Contribution[];
  }> => {
    try {
      if (!tx_hash) {
        const { policyId, assetName } = await this.wallet.getIdToken();

        const refAssetName = CIP68_100(assetName.slice(3));
        const { txHash, index } = await this.blockFrost.getIdRefTxHash(
          policyId,
          refAssetName
        );
        const { gitHub, contributions } = await this.blockFrost.getIdTokenDatum(
          txHash,
          index
        );
        return { gitHub, contributions };
      } else {
        const { gitHub, contributions } = await this.blockFrost.getIdTokenDatum(
          tx_hash,
          outputIndex!
        );
        return { gitHub, contributions };
      }
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
