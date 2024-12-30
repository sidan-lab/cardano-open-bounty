use aiken/collection/list
use aiken/primitive/bytearray
use cardano/assets.{AssetName, PolicyId, flatten, without_lovelace}
use cardano/transaction.{Datum, OutputReference, Transaction} as tx
use cip.{cip68_100_prefix, cip68_222, cip68_222_prefix}
use identity_token_type.{to_contributer_datum}
use identity_token_util.{has_all_signers}
use oracle_token_type.{OracleDatum}
use oracle_token_util.{get_oracle_nft_datum}

validator update_identity_token(
  collection_name: ByteArray,
  oracle_nft: (PolicyId, AssetName),
) {
  spend(own_ref: OutputReference, transaction: Transaction) {
    let Transaction { inputs, extra_signatories, reference_inputs, .. } =
      transaction

    expect oracle_input_datum: OracleDatum =
      reference_inputs |> get_oracle_nft_datum(oracle_nft)
    expect Some(own_input) =
      inputs |> list.find(fn(input) { input.output_reference == own_ref })
    expect [(policy_id, ref_asset_name, amount)] =
      own_input.output.value |> without_lovelace() |> flatten()

    let name_check =
      ref_asset_name |> bytearray.starts_with(prefix: cip.cip68_100_prefix)

    // Get NFT AssetName
    let nft_asset_name = ref_asset_name |> bytearray.drop(n: 4) |> cip68_222()

    expect Some(id_nft) =
      inputs
        |> list.find(
            fn(input) {
              when
                input.output.value
                  |> flatten()
                  |> list.find(
                      fn((policy, asset_name, _)) {
                        asset_name == nft_asset_name && policy == policy_id
                      },
                    )
              is {
                Some(_) -> True
                _ -> False
              }
            },
          )
    expect Some(bounty_nft) =
      inputs
        |> list.find(
            fn(input) {
              when
                input.output.value
                  |> flatten()
                  |> list.find(
                      fn((policy, _, _)) {
                        policy == oracle_input_datum.bounty_token_policy_id
                      },
                    )
              is {
                Some(_) -> True
                _ -> False
              }
            },
          )
    let signer_check = extra_signatories |> has_all_signers()

    let datum_check = (datum.github != @"")? && (datum.contributions == [])?
  }

  else(_) {
    fail
  }
}
