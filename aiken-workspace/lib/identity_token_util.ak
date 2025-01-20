use aiken/collection/list
use aiken/collection/pairs
use aiken/crypto.{VerificationKeyHash}
use aiken/primitive/bytearray
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
          fn(input) {
            quantity_of(input.output.value, id_nft.1st, id_nft.2nd) == 1
          },
        )

  let contributer_input_data: Data =
    when contributer_input.output.datum is {
      NoDatum -> fail @"input does not contain any datum"
      DatumHash(_) -> fail @"input datum must be inlined"
      InlineDatum(data) -> data
    }

  expect contributer_input_datum: ContributerDatum = contributer_input_data
  contributer_input_datum
}

pub fn update_contributor_datum(
  contributer_datum: ContributerDatum,
  bounty_owner: VerificationKeyHash,
  reward: Int,
) -> ContributerDatum {
  let new_contribution =
    when pairs.get_first(contributer_datum.contributions, bounty_owner) is {
      Some(current_contribution) -> current_contribution + reward
      None -> reward
    }

  let updated_datum: ContributerDatum =
    ContributerDatum {
      ..contributer_datum,
      contributions: contributer_datum.contributions
        |> pairs.repsert_by_ascending_key(
            bounty_owner,
            new_contribution,
            bytearray.compare,
          ),
    }

  updated_datum
}

pub fn is_token_provided(
  inputs: List<Input>,
  token_policy: PolicyId,
  token_name: AssetName,
) -> Bool {
  let id_nft_quantity =
    inputs
      |> list.filter(
          fn(input) {
            quantity_of(input.output.value, token_policy, token_name) == 1
          },
        )
      |> list.length()

  id_nft_quantity == 1
}
