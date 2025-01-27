use aiken/collection/list
use cardano/assets.{AssetName, PolicyId, quantity_of}
use cardano/transaction.{DatumHash, InlineDatum, Input, NoDatum}
use intent_token_type.{IntentDatum}

pub fn get_intent_datum(
  inputs: List<Input>,
  intent_token: (PolicyId, AssetName),
) -> IntentDatum {
  expect Some(intent_input) =
    inputs
      |> list.find(
          fn(input) {
            quantity_of(input.output.value, intent_token.1st, intent_token.2nd) == 1
          },
        )

  let intent_input_data: Data =
    when intent_input.output.datum is {
      NoDatum -> fail @"input does not contain any datum"
      DatumHash(_) -> fail @"input datum must be inlined"
      InlineDatum(data) -> data
    }

  expect intent_input_datum: IntentDatum = intent_input_data
  intent_input_datum
}

pub fn is_intent_provided(
  inputs: List<Input>,
  token_policy: PolicyId,
  token_name: AssetName,
) -> Bool {
  let intent_token_quantity =
    inputs
      |> list.filter(
          fn(input) {
            quantity_of(input.output.value, token_policy, token_name) == 1
          },
        )
      |> list.length()

  intent_token_quantity == 1
}
