use aiken/collection/list
use cardano/assets.{AssetName, PolicyId, quantity_of}
use cardano/transaction.{DatumHash, InlineDatum, Input, NoDatum}
use identity_token_type.{ContributerDatum}

pub fn get_contributer_datum(
  inputs: List<Input>,
  id_nft: (PolicyId, AssetName),
) -> ContributerDatum {
  expect Some(contributer_input) =
    inputs
      |> list.find(
          fn(ref_input: Input) {
            quantity_of(ref_input.output.value, id_nft.1st, id_nft.2nd) == 1
          },
        )

  let contributer_input_data: Data =
    when contributer_input.output.datum is {
      NoDatum -> fail @"Oracle input does not contain any datum"
      DatumHash(_) -> fail @"Oracle input datum must be inlined"
      InlineDatum(data) -> data
    }

  expect contributer_input_datum: ContributerDatum = contributer_input_data
  contributer_input_datum
}
