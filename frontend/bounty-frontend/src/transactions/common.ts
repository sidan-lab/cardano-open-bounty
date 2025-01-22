import {
  applyCborEncoding,
  applyParamsToScript,
  mTuple,
  resolveScriptHash,
  serializePlutusScript,
} from "@meshsdk/core";
import blueprint from "../../../../aiken-workspace/plutus.json";

export const getOracleNFTSpendingScriptCbor = () =>
  applyCborEncoding(blueprint.validators[13]!.compiledCode);

export const getIdOracleCounterSpendingScriptCbor = () =>
  applyCborEncoding(blueprint.validators[9]!.compiledCode);

export const getIdSpendingScriptCbor = () =>
  applyParamsToScript(
    blueprint.validators[7]!.compiledCode,
    [
      mTuple(
        process.env.NEXT_PUBLIC_ORACLE_NFT_POLICY_ID!,
        process.env.NEXT_PUBLIC_ORACLE_NFT_ASSET_NAME!
      ),
    ],
    "Mesh"
  );

export const getIdMintingScriptCbor = () =>
  applyParamsToScript(
    blueprint.validators[5]!.compiledCode,
    [
      mTuple(
        process.env.NEXT_PUBLIC_ORACLE_NFT_POLICY_ID!,
        process.env.NEXT_PUBLIC_ORACLE_NFT_ASSET_NAME!
      ),
      process.env.NEXT_PUBLIC_ID_ORACLE_COUNTER_POLICY_ID!,
    ],
    "Mesh"
  );

export const getBountyBoardScriptCbor = () =>
  applyParamsToScript(
    blueprint.validators[1]!.compiledCode,
    [
      mTuple(
        process.env.NEXT_PUBLIC_ORACLE_NFT_POLICY_ID!,
        process.env.NEXT_PUBLIC_ORACLE_NFT_ASSET_NAME!
      ),
    ],
    "Mesh"
  );

export const getBountyMintingScriptCbor = () =>
  applyParamsToScript(
    blueprint.validators[3]!.compiledCode,
    [
      mTuple(
        process.env.NEXT_PUBLIC_ORACLE_NFT_POLICY_ID!,
        process.env.NEXT_PUBLIC_ORACLE_NFT_ASSET_NAME!
      ),
    ],
    "Mesh"
  );

export const getOracleNFTAddress = () =>
  serializePlutusScript(
    {
      code: getOracleNFTSpendingScriptCbor(),
      version: "V3",
    },
    undefined,
    0
  ).address;

export const getIdOracleCounterAddress = () =>
  serializePlutusScript(
    {
      code: getIdOracleCounterSpendingScriptCbor(),
      version: "V3",
    },
    undefined,
    0
  ).address;

export const getIdSpendingScriptAddress = () =>
  serializePlutusScript(
    {
      code: getIdSpendingScriptCbor(),
      version: "V3",
    },
    undefined,
    0
  ).address;

export const getBountyBoardScriptAddress = () =>
  serializePlutusScript(
    {
      code: getBountyBoardScriptCbor(),
      version: "V3",
    },
    undefined,
    0
  ).address;

export const getIdSpendingScriptHash = () =>
  resolveScriptHash(getIdSpendingScriptCbor(), "V3");

export const getBountyBoardScriptHash = () =>
  resolveScriptHash(getBountyBoardScriptCbor(), "V3");

export const getIdMintingPolicyId = () =>
  resolveScriptHash(getIdMintingScriptCbor(), "V3");

export const getBountyMintingPolicyId = () =>
  resolveScriptHash(getBountyMintingScriptCbor(), "V3");
