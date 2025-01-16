use aiken/cbor
use aiken/crypto.{VerificationKeyHash}
use cardano/assets.{AssetName, PolicyId}
use cardano/transaction.{Datum, InlineDatum} as tx

pub type Action {
  CheckMint
  CheckBurn
}

pub type ContributerDatum {
  github: String,
  contributions: List<Contribution>,
}

pub type Contribution {
  all_signatories: List<VerificationKeyHash>,
  reward: Int,
}

pub fn to_contributer_datum(data: Datum) -> ContributerDatum {
  expect InlineDatum(my_datum) = data
  expect contributer_datum: ContributerDatum = my_datum
  contributer_datum
}

test contributerDatum_datum() {
  let datum: ContributerDatum =
    ContributerDatum { github: @"abc", contributions: [] }

  cbor.serialise(datum) != #"d8799f43616263d8799fd87a9f43616263ffd87a80ff43646566d8799fd87a9f43646566ffd87a80ffff"
}

pub type TestData {
  collection_name: ByteArray,
  oracle_nft: (PolicyId, AssetName),
  oracle_counter: PolicyId,
}

test action() {
  let data: TestData =
    TestData {
      collection_name: "a",
      oracle_nft: ("a", "aaa"),
      oracle_counter: "aaa",
    }

  cbor.serialise(data) == #"d8799f43616263d8799fd87a9f43616263ffd87a80ff43646566d8799fd87a9f43646566ffd87a80ffff"
}
