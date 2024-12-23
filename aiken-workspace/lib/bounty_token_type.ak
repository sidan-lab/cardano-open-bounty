use cardano/transaction.{Datum, InlineDatum} as tx

pub type Action {
  CheckMint
  CheckBurn
}
pub type BountyRedeemer {
  pub_key_hash: ByteArray,
  nft_tkn: Value,
  action: Action,
}

pub type BountyDatum {
  github: String,
  reward: Int,
}

pub fn to_bounty_datum(data: Datum) -> BountyDatum {
  expect InlineDatum(my_datum) = data
  expect contributer_datum: ContributerDatum = my_datum
  bounty_datum
}
