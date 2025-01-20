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
  ScriptAddress,
  scriptAddress,
  hashByteString,
} from "@meshsdk/common";

export type OracleNFTDatum = ConStr0<
  [PolicyId, ScriptAddress, PolicyId, ScriptAddress]
>;

export type OracleCounterDatum = ConStr0<[Integer, PubKeyAddress]>;

export type BountyDatum = ConStr0<[ByteString, Integer]>;

export type ContributerDatum = ConStr0<[ByteString, List<ContributionDatum>]>;

export type ContributionDatum = ConStr0<[List<PubKeyHash>, Integer]>;

export type ActionMint = ConStr0<[]>;

export type ActionBurn = ConStr1<[]>;

export const oracleNFTDatum = (
  bountyTokenPolicyId: string,
  bountyBoardScriptAddress: string,
  idTokenPolicyId: string,
  idTokenSpendingScriptAddress: string
): OracleNFTDatum =>
  conStr0([
    policyId(bountyTokenPolicyId),
    scriptAddress(bountyBoardScriptAddress),
    policyId(idTokenPolicyId),
    scriptAddress(idTokenSpendingScriptAddress),
  ]);

export const bountyDatum = (
  issueURL: string,
  bountyAmount: number
): BountyDatum => conStr0([hashByteString(issueURL), { int: bountyAmount }]);

export const contributerDatum  = (
  contributorAddress: string,
  contributions: ContributionDatum[]
): ContributerDatum {
  return conStr0([scriptAddress(contributorAddress), List.from(contributions)]);
}
