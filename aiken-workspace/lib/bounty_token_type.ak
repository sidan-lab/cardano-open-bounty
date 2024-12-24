use cardano/assets.{Value}
use cardano/transaction.{Datum, InlineDatum} as tx

pub type Action {
  CheckMint
  CheckBurn
}

pub type BountyRedeemer {
  pub_key_hash: ByteArray,
  action: Action,
}

pub type BountyDatum {
  github: String,
  reward: Int,
}

pub fn to_bounty_datum(data: Datum) -> BountyDatum {
  expect InlineDatum(my_datum) = data
  expect bounty_datum: BountyDatum = my_datum
  bounty_datum
}
