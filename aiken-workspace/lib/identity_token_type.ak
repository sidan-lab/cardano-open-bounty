use cardano/assets.{AssetName, PolicyId}
use cardano/transaction.{Datum, InlineDatum} as tx

pub type Action {
  CheckMint
  CheckBurn
}

pub type IdRedeemr {
  action: Action,
  token_name: ByteArray,
}

pub type ContributerDatum {
  metadata: Pairs<Data, Data>,
  // GitHub: ByteArray
  version: Int,
  contributions: Pairs<ByteArray, Int>,
  pub_key_hash: ByteArray,
}

pub fn to_contributer_datum(data: Datum) -> ContributerDatum {
  expect InlineDatum(my_datum) = data
  expect contributer_datum: ContributerDatum = my_datum
  contributer_datum
}

pub type TestData {
  collection_name: ByteArray,
  oracle_nft: (PolicyId, AssetName),
  oracle_counter: PolicyId,
}
