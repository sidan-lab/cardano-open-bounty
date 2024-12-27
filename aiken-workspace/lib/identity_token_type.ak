use cardano/transaction.{Datum, InlineDatum} as tx

pub type Action {
  CheckMint
  CheckBurn
}

pub type IdRedeemer {
  pub_key_hash: ByteArray,
  action: Action,
}

pub type ContributerDatum {
  index: Int,
  github: String,
  contributions: List<Contribution>,
}

pub type Contribution {
  signers: List<ByteArray>,
  amount: Int,
}

pub fn to_contributer_datum(data: Datum) -> ContributerDatum {
  expect InlineDatum(my_datum) = data
  expect contributer_datum: ContributerDatum = my_datum
  contributer_datum
}
