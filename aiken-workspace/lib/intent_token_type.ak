use cardano/address.{Address}
use cardano/transaction.{Datum, InlineDatum, OutputReference} as tx

pub type IntentRedeemr {
  RedeemBounty(Address)
  AccpetRedeem
  CancelRedeem
}

pub type IntentDatum {
  bounty_utxo: OutputReference,
  contributor_address: Address,
}

pub fn to_intent_datum(data: Datum) -> IntentDatum {
  expect InlineDatum(my_datum) = data
  expect intent_datum: IntentDatum = my_datum
  intent_datum
}
