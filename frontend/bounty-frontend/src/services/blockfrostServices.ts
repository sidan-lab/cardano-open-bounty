import {
  ContributerDatum,
  OracleCounterDatum,
  ContributionDatum,
  BountyDatum,
} from "@/pages/api/type";
import {
  BlockfrostProvider,
  deserializeDatum,
  stringToHex,
} from "@meshsdk/core";
import { AddressUtxo, AssetTransaction, Bounty, Contribution } from "./type";

export class BlockfrostService {
  blockFrost: BlockfrostProvider;

  getOracleCounterDatumn = async (
    txHash: string,
    index: number
  ): Promise<{ count: number }> => {
    try {
      const utxo = await this.blockFrost.fetchUTxOs(txHash, index);

      const datum = utxo[0].output.plutusData!;

      const data: OracleCounterDatum = deserializeDatum(datum);
      const count = Number(data.fields[0].int);

      return { count };
    } catch (error) {
      console.error("Error fetching count:", error);
      throw error;
    }
  };

  getIdTokenTxHash = async (
    policyId: string,
    assetName: string
  ): Promise<{ txHash: string; index: number }> => {
    const asset = policyId + stringToHex(assetName);
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

  getIdTokenDatum = async (
    txHash: string,
    index: number
  ): Promise<{ gitHub: string; contributions: Contribution[] }> => {
    try {
      const utxo = await this.blockFrost.fetchUTxOs(txHash, index);

      const datum = utxo[0].output.plutusData!;

      const data: ContributerDatum = deserializeDatum(datum);
      const gitHub = data.fields[0].bytes;
      const contributions: Contribution[] = [];
      const contributionDatum: ContributionDatum[] = data.fields[1].list;
      contributionDatum.forEach((item) => {
        const all_signs: string[] = [];
        item.fields[0].list.forEach((sign) => {
          all_signs.push(sign.toString());
        });

        const contribution: Contribution = {
          all_signatories: all_signs,
          reward: Number(item.fields[1].int),
        };
        contributions.push(contribution);
      });

      return { gitHub, contributions };
    } catch (error) {
      console.error("Error fetching count:", error);
      throw error;
    }
  };

  getAllBountyDatumn = async (
    address: string
  ): Promise<{ bounties: Bounty[] }> => {
    const url = `/addresses/${address}/utxos
`;
    try {
      const addressUtxos: AddressUtxo[] = await this.blockFrost.get(url);

      const bounties: Bounty[] = [];

      const bountyDatum: BountyDatum[] = [];

      addressUtxos.forEach((uxto) => {
        if (uxto.inline_datum) {
          const data: BountyDatum = deserializeDatum(uxto.inline_datum);
          const all_signs: string[] = [];
          data.fields[2].list.forEach((sign) => {
            all_signs.push(sign.toString());
          });

          const bounty: Bounty = {
            name: uxto.amount.find()?.unit.slice(56),
            issue_url: data.fields[0].toString(),
            reward: Number(data.fields[1].int),
            all_signatories: all_signs,
          };
          bounties.push(bounty);
        }
      });

      return { bounties };
    } catch (error) {
      console.error("Error geting all bounty:", error);
      throw error;
    }
  };

  constructor() {
    this.blockFrost = new BlockfrostProvider(
      process.env.NEXT_PUBLIC_BLOCKFROST_API_KEY!
    );
  }
}
