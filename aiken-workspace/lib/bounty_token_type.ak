use aiken/cbor
use aiken/crypto.{VerificationKeyHash}
use cardano/transaction.{Datum, InlineDatum} as tx

pub type Action {
  CheckMint
  CheckBurn
}

pub type BountyRedeemer {
  action: Action,
}

pub type BountyDatum {
  issue_url: Data,
  reward: Int,
  all_signatories: List<VerificationKeyHash>,
}

pub fn to_bounty_datum(data: Datum) -> BountyDatum {
  expect InlineDatum(my_datum) = data
  expect bounty_datum: BountyDatum = my_datum
  bounty_datum
}

test bounty_datum() {
  let datum: BountyDatum =
    BountyDatum {
      issue_url: "abc@gmail.com",
      reward: 123,
      all_signatories: [
        "91f740da89f81ef5e99264e2c482f96be96ceab7f9e47907f414db9b",
      ],
    }
  cbor.serialise(datum) == #"d8799f43616263d8799fd87a9f43616263ffd87a80ff43646566d8799fd87a9f43646566ffd87a80ffff"
}
