import {
  Asset,
  BlockfrostProvider,
  deserializeDatum,
  hexToString,
} from "@meshsdk/core";
import { AddressUtxo, AssetTransaction, BountyWithName } from "./type";
import {
  Bounty,
  BountyDatum,
  Contributor,
  convertBountyDatum,
  convertOracleCounterDatum,
  OracleCounter,
  OracleCounterDatum,
} from "@/transactions/types";
import {
  getBountyMintingPolicyId,
  getIdMintingPolicyId,
} from "@/transactions/common";
import {
  getAssetNameByPolicyId,
  getOutputIndexAndDatumByAsset,
  getOutputIndexByAsset,
} from "./common";

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

      const txHash = assetTransactions[assetTransactions.length - 1].tx_hash;

      const utxo = await this.blockFrost.fetchUTxOs(txHash);
      const asset: Asset = {
        unit: policyId + assetName,
        quantity: "1",
      };

      const index = getOutputIndexByAsset(utxo, asset);

      if (!index) {
        throw new Error("Error getIdTokenTxHash cannot find outputIndex");
      }
      return { txHash, index };
    } catch (error) {
      console.error("Error geting idToken txHash:", error);
      throw error;
    }
  };

  getIdRefTxAndDatum = async (
    policyId: string,
    assetName: string
  ): Promise<{
    txHash: string;
    index: number;
    contributor: Contributor;
  }> => {
    const asset = policyId + assetName;
    const url = `/assets/${asset}/transactions`;
    try {
      const assetTransactions: AssetTransaction[] = await this.blockFrost.get(
        url
      );

      const txHash = assetTransactions[assetTransactions.length - 1].tx_hash;

      const utxo = await this.blockFrost.fetchUTxOs(txHash);
      const asset: Asset = {
        unit: policyId + assetName,
        quantity: "1",
      };

      const { outputIndex, contributor } = getOutputIndexAndDatumByAsset(
        utxo,
        asset
      );

      if (!outputIndex || !contributor) {
        throw new Error("Error getIdTokenTxHash cannot find outputIndex");
      }

      return { txHash, index: outputIndex, contributor };
    } catch (error) {
      console.error("Error geting idToken txHash:", error);
      throw error;
    }
  };

  getAllBountyDatumn = async (address: string): Promise<BountyWithName[]> => {
    const url = `/addresses/${address}/utxos
`;
    try {
      const addressUtxos: AddressUtxo[] = await this.blockFrost.get(url);

      const bounties: BountyWithName[] = [];

      addressUtxos.forEach((utxo) => {
        if (utxo.inline_datum) {
          const name = getAssetNameByPolicyId(
            utxo.amount,
            this.bountyMintingPolicyId
          );

          if (name) {
            const datum: BountyDatum = deserializeDatum(utxo.inline_datum);

            const bounty: Bounty = convertBountyDatum(datum);

            const bountyWithName: BountyWithName = {
              name: hexToString(name),
              issue_url: bounty.issue_url,
              reward: bounty.reward,
              txHash: utxo.tx_hash,
              outputIndex: utxo.output_index,
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

  //todo: fix api error
  getOwnBountyDatumn = async (
    address: string,
    asset: string
  ): Promise<BountyWithName[]> => {
    const url = `/addresses/${address}/utxos/${asset}
`;
    try {
      const addressUtxos: AddressUtxo[] = await this.blockFrost.get(url);

      const bounties: BountyWithName[] = [];

      addressUtxos.forEach((utxo) => {
        if (utxo.inline_datum) {
          const name = getAssetNameByPolicyId(
            utxo.amount,
            this.bountyMintingPolicyId
          );

          if (name) {
            const datum: BountyDatum = deserializeDatum(utxo.inline_datum);

            const bounty: Bounty = convertBountyDatum(datum);

            const bountyWithName: BountyWithName = {
              name: name,
              issue_url: bounty.issue_url,
              reward: bounty.reward,
              txHash: utxo.tx_hash,
              outputIndex: utxo.output_index,
            };
            bounties.push(bountyWithName);
          }
        }
      });

      return bounties;
    } catch (error) {
      console.error("Error geting own bounty:", error);
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
