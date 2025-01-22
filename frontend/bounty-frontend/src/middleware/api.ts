import { CIP68_100, hexToString, IWallet, stringToHex } from "@meshsdk/core";
import { UserWalletService } from "@/services/walletServices";
import { BlockfrostService } from "@/services/blockfrostServices";
import { Contributor, GitHub } from "@/transactions/types";
import { BountyWithName } from "@/services/type";
import {
  getBountyBoardScriptAddress,
  getIdMintingPolicyId,
} from "@/transactions/common";

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

  getIdToken = async (): Promise<{
    policyId: string;
    tokenName: string;
  }> => {
    try {
      const { policyId, assetName } = await this.wallet.getIdToken();

      const tokenName: string = hexToString(assetName.slice(8));

      return { policyId, tokenName };
    } catch (error) {
      console.error("Error getting id tx :", error);
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
    tokenName: string;
    txHash: string;
    index: number;
  }> => {
    try {
      const { policyId, assetName } = await this.wallet.getIdToken();

      const tokenName = hexToString(assetName.slice(8));

      const { txHash, index } = await this.blockFrost.getIdTokenTxHash(
        policyId,
        assetName
      );

      return { tokenName, txHash, index };
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
      const { txHash, index } = await this.blockFrost.getIdRefTxAndDatum(
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
    contributor: Contributor;
    tx_hash: string;
    outputIndex: number;
  }> => {
    try {
      const { policyId, assetName } = await this.wallet.getIdToken();

      const refAssetName = CIP68_100(assetName.slice(8));

      const { txHash, index, contributor } =
        await this.blockFrost.getIdRefTxAndDatum(policyId, refAssetName);

      const tx_hash: string = txHash;
      const outputIndex: number = index;
      const tokenName: string = hexToString(assetName.slice(8));
      const gitHub: string = contributor.metadata.get(GitHub)!;

      const contributions: Map<string, number> = contributor.contributions;
      return {
        tx_hash,
        outputIndex,
        tokenName,
        gitHub,
        contributions,
        contributor,
      };
    } catch (error) {
      console.error("Error getting id info :", error);
      throw error;
    }
  };

  getOwnerIdInfo = async (
    tokenName: string
  ): Promise<{
    pubKeyHash: string;
    tx_hash: string;
    outputIndex: number;
  }> => {
    try {
      const policyId = getIdMintingPolicyId();
      const assetName = CIP68_100(stringToHex(tokenName));

      const { txHash, index, contributor } =
        await this.blockFrost.getIdRefTxAndDatum(policyId, assetName);

      const pubKeyHash: string = contributor.pub_key_hash;

      const tx_hash: string = txHash;
      const outputIndex: number = index;

      return { pubKeyHash, tx_hash, outputIndex };
    } catch (error) {
      console.error("Error getting owner id info :", error);
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

  getAllBounty = async (): Promise<BountyWithName[]> => {
    try {
      const bountyBoardScriptAddress = getBountyBoardScriptAddress();
      const bounties: BountyWithName[] =
        await this.blockFrost.getAllBountyDatumn(bountyBoardScriptAddress);

      return bounties;
    } catch (error) {
      console.error("Error fetching count:", error);
      throw error;
    }
  };

  getOwnBounty = async (): Promise<BountyWithName[]> => {
    try {
      const { policyId, assetName } = await this.wallet.getIdToken();
      const asset = policyId + assetName.slice(8);

      const bountyBoardScriptAddress = getBountyBoardScriptAddress();
      const bounties: BountyWithName[] =
        await this.blockFrost.getOwnBountyDatumn(
          bountyBoardScriptAddress,
          asset
        );

      return bounties;
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
