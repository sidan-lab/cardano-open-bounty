import { BlockfrostProvider, deserializeDatum } from "@meshsdk/core";
import { AddressUtxo, AssetTransaction, BountyWithName } from "./type";
import {
  Bounty,
  BountyDatum,
  Contributor,
  ContributorDatum,
  convertBountyDatum,
  convertContributorDatum,
  convertOracleCounterDatum,
  OracleCounter,
  OracleCounterDatum,
} from "@/transactions/types";
import {
  getBountyMintingPolicyId,
  getIdMintingPolicyId,
} from "@/transactions/common";
import { getAssetNameByPolicyId } from "./common";

export class BlockfrostService {
  blockFrost: BlockfrostProvider;
  idMintingPolicyId: string;
  bountyMintingPolicyId: string;

  getOracleCounterDatumn = async (
    txHash: string,
    index: number
  ): Promise<OracleCounter> => {
    try {
      const utxo = await this.blockFrost.fetchUTxOs(txHash, index);

      const plutusData = utxo[0].output.plutusData!;

      const datum: OracleCounterDatum = deserializeDatum(plutusData);

      const oracleCounter: OracleCounter = convertOracleCounterDatum(datum);

      return oracleCounter;
    } catch (error) {
      console.error("Error fetching count:", error);
      throw error;
    }
  };

  getIdTokenTxHash = async (
    policyId: string,
    assetName: string
  ): Promise<{ txHash: string; index: number }> => {
    const asset = policyId + assetName;
    const url = `/assets/${asset}/transactions`;
    try {
      const assetTransactions: AssetTransaction[] = await this.blockFrost.get(
        url
      );

      const txHash = assetTransactions[0].tx_hash;

      const index = assetTransactions[0].tx_index;

      return { txHash, index };
    } catch (error) {
      console.error("Error geting idToken txHash:", error);
      throw error;
    }
  };

  getIdRefTxHash = async (
    policyId: string,
    assetName: string
  ): Promise<{ txHash: string; index: number }> => {
    const asset = policyId + assetName;
    const url = `/assets/${asset}/transactions`;
    try {
      const assetTransactions: AssetTransaction[] = await this.blockFrost.get(
        url
      );

      const txHash = assetTransactions[0].tx_hash;

      const index = 1;
      console.log(assetTransactions);

      return { txHash, index };
    } catch (error) {
      console.error("Error geting idToken txHash:", error);
      throw error;
    }
  };

  getIdTokenDatum = async (
    txHash: string,
    index: number
  ): Promise<Contributor> => {
    try {
      const utxo = await this.blockFrost.fetchUTxOs(txHash, index);

      const plutusData = utxo[0].output.plutusData!;

      const datum: ContributorDatum = deserializeDatum(plutusData);

      const contributor: Contributor = convertContributorDatum(datum);

      console.log(contributor);

      return contributor;
    } catch (error) {
      console.error("Error fetching count:", error);
      throw error;
    }
  };

  getAllBountyDatumn = async (address: string): Promise<BountyWithName[]> => {
    const url = `/addresses/${address}/utxos
`;
    try {
      const addressUtxos: AddressUtxo[] = await this.blockFrost.get(url);

      const bounties: BountyWithName[] = [];

      addressUtxos.forEach((uxto) => {
        if (uxto.inline_datum) {
          const name = getAssetNameByPolicyId(
            uxto.amount,
            this.bountyMintingPolicyId
          );

          if (name) {
            const datum: BountyDatum = deserializeDatum(uxto.inline_datum);

            const bounty: Bounty = convertBountyDatum(datum);

            const bountyWithName: BountyWithName = {
              name: name,
              issue_url: bounty.issue_url,
              reward: bounty.reward,
            };
            bounties.push(bountyWithName);
          }
        }
      });

      return bounties;
    } catch (error) {
      console.error("Error geting all bounty:", error);
      throw error;
    }
  };

  constructor() {
    this.blockFrost = new BlockfrostProvider(
      process.env.NEXT_PUBLIC_BLOCKFROST_API_KEY!
    );

    this.idMintingPolicyId = getIdMintingPolicyId();

    this.bountyMintingPolicyId = getBountyMintingPolicyId();
  }
}
