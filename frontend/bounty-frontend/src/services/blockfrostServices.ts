import {
  ContributerDatum,
  OracleCounterDatum,
  ContributionDatum,
  BountyDatum,
} from "@/pages/api/type";
import {
  applyParamsToScript,
  BlockfrostProvider,
  deserializeDatum,
  mTuple,
  resolveScriptHash,
  stringToHex,
} from "@meshsdk/core";
import blueprint from "../../../../aiken-workspace/plutus.json";
import { AddressUtxo, AssetTransaction, Bounty, Contribution } from "./type";

export class BlockfrostService {
  blockFrost: BlockfrostProvider;
  idMintingPolicyId: string;
  bountyMintingPolicyId: string;

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

  getIdRefTxHash = async (
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

      addressUtxos.forEach((uxto) => {
        if (uxto.inline_datum) {
          const data: BountyDatum = deserializeDatum(uxto.inline_datum);
          const all_signs: string[] = [];
          data.fields[2].list.forEach((sign) => {
            all_signs.push(sign.toString());
          });

          const bounty: Bounty = {
            name: uxto.amount
              .find((a) => a.unit.slice(0, 56) == this.bountyMintingPolicyId)!
              .unit.slice(56),
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

    const idMintingScriptCbor = applyParamsToScript(
      blueprint.validators[5]!.compiledCode,
      [
        stringToHex(`${process.env.NEXT_PUBLIC_COLLECTION_NAME!}`),
        mTuple(
          process.env.NEXT_PUBLIC_ORACLE_NFT_POLICY_ID!,
          process.env.NEXT_PUBLIC_ORACLE_NFT_ASSET_NAME!
        ),
        process.env.NEXT_PUBLIC_ID_ORACLE_COUNTER_POLICY_ID!,
      ],
      "Mesh"
    );
    this.idMintingPolicyId = resolveScriptHash(idMintingScriptCbor, "V3");

    const bountyMintingScriptCbor = applyParamsToScript(
      blueprint.validators[3]!.compiledCode,
      [
        mTuple(
          process.env.NEXT_PUBLIC_ORACLE_NFT_POLICY_ID!,
          process.env.NEXT_PUBLIC_ORACLE_NFT_ASSET_NAME!
        ),
      ],
      "Mesh"
    );
    const bountyMintingPolicyId = resolveScriptHash(
      bountyMintingScriptCbor,
      "V3"
    );
    this.bountyMintingPolicyId = bountyMintingPolicyId;
  }
}
