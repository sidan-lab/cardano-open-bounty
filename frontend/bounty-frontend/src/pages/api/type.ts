import {
  ConStr0,
  Integer,
  PubKeyAddress,
  List,
  PubKeyHash,
  ByteString,
  ConStr1,
  PolicyId,
} from "@meshsdk/common";

export type OracleNFTDatum = ConStr0<
  [PolicyId, PubKeyAddress, PolicyId, PubKeyAddress]
>;

export type OracleCounterDatum = ConStr0<[Integer, PubKeyAddress]>;

export type BountyDatum = ConStr0<[ByteString, Integer, List<PubKeyHash>]>;

export type ContributerDatum = ConStr0<[ByteString, List<ContributionDatum>]>;
export type ContributionDatum = ConStr0<[List<PubKeyHash>, Integer]>;

export type ActionMint = ConStr0<[]>;

export type ActionBurn = ConStr1<[]>;
