import {
  ConStr0,
  Integer,
  PubKeyAddress,
  PubKeyHash,
  ByteString,
  ConStr1,
  PolicyId,
  conStr0,
  policyId,
  ScriptAddress,
  scriptAddress,
  hashByteString,
  pubKeyAddress,
  Data,
  conStr1,
  AssocMap,
  assocMap,
  byteString,
  integer,
  pubKeyHash,
} from "@meshsdk/common";

export type OracleNFTDatum = ConStr0<
  [PolicyId, ScriptAddress, PolicyId, ScriptAddress, PubKeyAddress]
>;

export type OracleCounterDatum = ConStr0<[Integer, PubKeyAddress]>;

export type BountyDatum = ConStr0<[ByteString, Integer]>;

export type ContributorDatum = ConStr0<
  [AssocMap<Data, Data>, Integer, AssocMap<ByteString, Integer>, PubKeyHash]
>;

export type ActionMint = ConStr0<[]>;

export type ActionBurn = ConStr1<[]>;

export type ActionUpdate = ConStr0<[]>;

export type ActionStop = ConStr0<[]>;

export type BountyBurn = ConStr1<[ByteString]>;

export type OracleNFT = {
  bounty_token_policy_id: string;
  bounty_board_address: string;
  id_token_policy_id: string;
  id_token_store_address: string;
  owner: string;
};

export type OracleCounter = {
  count: number;
  owner: string;
};

export type Bounty = {
  issue_url: string;
  reward: number;
};

export type Contributor = {
  metadata: Map<Data, Data>;
  version: number;
  contributions: Map<string, number>;
  pub_key_hash: string;
};

export const oracleNFTDatum = (
  bountyTokenPolicyId: string,
  bountyBoardScriptAddress: string,
  idTokenPolicyId: string,
  idTokenSpendingScriptAddress: string,
  owner: string
): OracleNFTDatum =>
  conStr0([
    policyId(bountyTokenPolicyId),
    scriptAddress(bountyBoardScriptAddress),
    policyId(idTokenPolicyId),
    scriptAddress(idTokenSpendingScriptAddress),
    pubKeyAddress(owner),
  ]);

export const oracleCounterDatum = (
  count: number,
  owner: string
): OracleCounterDatum => conStr0([integer(count), pubKeyAddress(owner)]);

export const bountyDatum = (
  issueURL: string,
  bountyAmount: number
): BountyDatum => conStr0([hashByteString(issueURL), integer(bountyAmount)]);

export const contributorDatum = (
  metadata: Map<Data, Data>,
  version: number,
  contributions: Map<string, number>,
  pub_key_hash: string
): ContributorDatum => {
  const metaDataItems: [Data, Data][] = Array.from(metadata.entries());
  const metadataPluts: AssocMap<Data, Data> = assocMap<Data, Data>(
    metaDataItems
  );

  const contributionsItems: [ByteString, Integer][] = Array.from(
    contributions.entries()
  ).map(([key, value]) => [byteString(key), integer(value)]);

  const contributionsPluts: AssocMap<ByteString, Integer> = assocMap<
    ByteString,
    Integer
  >(contributionsItems);

  return conStr0([
    metadataPluts,
    integer(version),
    contributionsPluts,
    pubKeyHash(pub_key_hash),
  ]);
};

export const bountyBurn = (contributor_pub_key_hash: string): BountyBurn =>
  conStr1([{ bytes: contributor_pub_key_hash }]);

export function convertOracleNFTrDatum(datum: OracleNFTDatum): OracleNFT {
  const bounty_token_policy_id: string = datum.fields[0].bytes;
  const bounty_board_address: string =
    datum.fields[1].fields[0].fields[0].bytes;
  const id_token_policy_id: string = datum.fields[2].bytes;
  const id_token_store_address: string =
    datum.fields[3].fields[0].fields[0].bytes;
  const owner: string = datum.fields[4].fields[0].fields[0].bytes;

  return {
    bounty_token_policy_id: bounty_token_policy_id,
    bounty_board_address: bounty_board_address,
    id_token_policy_id: id_token_policy_id,
    id_token_store_address: id_token_store_address,
    owner: owner,
  };
}

export function convertOracleCounterDatum(
  datum: OracleCounterDatum
): OracleCounter {
  const count: number = Number(datum.fields[0].int);
  const owner: string = datum.fields[1].fields[0].fields[0].bytes;
  return {
    count: count,
    owner: owner,
  };
}

export function convertBountyDatum(datum: BountyDatum): Bounty {
  const issue_url: string = datum.fields[0].bytes;
  const reward: number = Number(datum.fields[1].int);
  return {
    issue_url: issue_url,
    reward: reward,
  };
}

export function convertContributorDatum(datum: ContributorDatum): Contributor {
  const metadata: Map<Data, Data> = new Map();
  datum.fields[0].map.forEach((item) => {
    metadata.set(item.k, item.v);
  });

  const contributions: Map<string, number> = new Map();
  datum.fields[2].map.forEach((item) => {
    contributions.set(item.k.bytes, Number(item.v.int));
  });

  const version: number = Number(datum.fields[1].int);
  const pub_key_hash: string = datum.fields[3].bytes;
  return {
    metadata: metadata,
    version: version,
    contributions: contributions,
    pub_key_hash: pub_key_hash,
  };
}
