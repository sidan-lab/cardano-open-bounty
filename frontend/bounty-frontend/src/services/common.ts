import {
  Contributor,
  ContributorDatum,
  convertContributorDatum,
} from "@/transactions/types";
import { Asset, deserializeDatum, UTxO } from "@meshsdk/core";

export function getAssetNameByPolicyId(
  amounts: { unit: string; quantity: string }[],
  policyId: string
): string | null {
  const policyIdLength = 56; // Assuming the policyId is always 56 characters

  for (const { unit } of amounts) {
    const currentPolicyId = unit.slice(0, policyIdLength);
    const assetName = unit.slice(policyIdLength);

    if (currentPolicyId === policyId) {
      return assetName;
    }
  }

  return null;
}

export function getOutputIndexByAsset(
  utxos: UTxO[],
  asset: Asset
): number | null {
  for (const utxo of utxos) {
    for (const amount of utxo.output.amount) {
      if (
        amount.unit === asset.unit &&
        amount.quantity.toString() === asset.quantity.toString()
      ) {
        return utxo.input.outputIndex;
      }
    }
  }
  return null;
}

export function getOutputIndexAndDatumByAsset(
  utxos: UTxO[],
  asset: Asset
): { outputIndex: number | null; contributor: Contributor | null } {
  for (const utxo of utxos) {
    for (const amount of utxo.output.amount) {
      if (
        amount.unit === asset.unit &&
        amount.quantity.toString() === asset.quantity.toString()
      ) {
        const plutusData = utxo.output.plutusData!;
        const datum: ContributorDatum = deserializeDatum(plutusData);

        const contributor: Contributor = convertContributorDatum(datum);
        const outputIndex = utxo.input.outputIndex;

        return { outputIndex, contributor };
      }
    }
  }
  return { outputIndex: null, contributor: null };
}
