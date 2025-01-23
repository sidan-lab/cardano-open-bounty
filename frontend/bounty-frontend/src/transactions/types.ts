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
  pubKeyAddress,
  conStr1,
  AssocMap,
  assocMap,
  integer,
  pubKeyHash,
  stringToHex,
  byteString,
  hexToString,
} from "@meshsdk/common";

export type OracleNFTDatum = ConStr0<
  [PolicyId, ScriptAddress, PolicyId, ScriptAddress, PubKeyAddress]
>;

export type OracleCounterDatum = ConStr0<[Integer, PubKeyAddress]>;

export type IdRedeemrMint = ConStr0<[ActionMint, ByteString]>;

export type IdRedeemrBurn = ConStr0<[ActionBurn, ByteString]>;

export type BountyDatum = ConStr0<[ByteString, Integer]>;

export type ContributorDatum = ConStr0<
  [
    AssocMap<ByteString, ByteString>,
    Integer,
    AssocMap<ByteString, Integer>,
    PubKeyHash
  ]
>;

export type ActionMint = ConStr0<[]>;

export type ActionBurn = ConStr1<[]>;

export type ActionUpdate = ConStr0<[]>;

export type ActionStop = ConStr1<[]>;

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
  metadata: Map<string, string>;
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

export const idRedeemrMint = (tokenName: string): IdRedeemrMint =>
  conStr0([actionMint, byteString(stringToHex(tokenName))]);

export const idRedeemrBurn = (tokenName: string): IdRedeemrBurn =>
  conStr0([actionBurn, byteString(stringToHex(tokenName))]);

export const bountyDatum = (
  issueURL: string,
  bountyAmount: number
): BountyDatum =>
  conStr0([byteString(stringToHex(issueURL)), integer(bountyAmount)]);

export const contributorDatum = (
  metadata: Map<string, string>,
  version: number,
  contributions: Map<string, number>,
  pub_key_hash: string
): ContributorDatum => {
  const metaDataItems: [ByteString, ByteString][] = Array.from(
    metadata.entries()
  ).map(([key, value]) => [
    byteString(stringToHex(key)),
    byteString(stringToHex(value)),
  ]);

  const metadataPluts: AssocMap<ByteString, ByteString> = assocMap<
    ByteString,
    ByteString
  >(metaDataItems);

  const contributionsItems: [ByteString, Integer][] = Array.from(
    contributions.entries()
  ).map(([key, value]) => [byteString(stringToHex(key)), integer(value)]);

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

export const actionMint: ActionMint = conStr0([]);

export const actionBurn: ActionBurn = conStr1([]);

export const actionUpdate: ActionUpdate = conStr0([]);

export const actionStop: ActionStop = conStr1([]);

export const GitHub: string = "GitHub";

export const bountyBurn = (contributor_asset_name: string): BountyBurn =>
  conStr1([byteString(stringToHex(contributor_asset_name))]);

export function convertOracleNFTDatum(datum: OracleNFTDatum): OracleNFT {
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
  const issue_url: string = hexToString(datum.fields[0].bytes);
  const reward: number = Number(datum.fields[1].int);
  return {
    issue_url: issue_url,
    reward: reward,
  };
}

export function convertContributorDatum(datum: ContributorDatum): Contributor {
  const metadata: Map<string, string> = new Map();

  datum.fields[0].map.forEach((item) => {
    metadata.set(hexToString(item.k.bytes), hexToString(item.v.bytes));
  });

  const contributions: Map<string, number> = new Map();
  datum.fields[2].map.forEach((item) => {
    contributions.set(hexToString(item.k.bytes), Number(item.v.int));
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
