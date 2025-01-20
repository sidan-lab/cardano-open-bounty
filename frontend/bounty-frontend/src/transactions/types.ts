import {
  ConStr0,
  Integer,
  PubKeyAddress,
  List,
  PubKeyHash,
  ByteString,
  ConStr1,
  PolicyId,
  conStr0,
  policyId,
  pubKeyAddress,
  ScriptAddress,
  scriptAddress,
} from "@meshsdk/common";

export type OracleNFTDatum = ConStr0<
  [PolicyId, ScriptAddress, PolicyId, ScriptAddress]
>;

export const oracleNFTDatum = (bountyTokenPolicyId: string) =>
  conStr0([
    policyId(bountyTokenPolicyId),
    scriptAddress(),
    policyId(),
    scriptAddress(),
  ]);

export type OracleCounterDatum = ConStr0<[Integer, PubKeyAddress]>;

export type BountyDatum = ConStr0<[ByteString, Integer, List<PubKeyHash>]>;

export type ContributerDatum = ConStr0<[ByteString, List<ContributionDatum>]>;
export type ContributionDatum = ConStr0<[List<PubKeyHash>, Integer]>;

export type ActionMint = ConStr0<[]>;

export type ActionBurn = ConStr1<[]>;
