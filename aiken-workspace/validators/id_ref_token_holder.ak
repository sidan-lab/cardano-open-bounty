use aiken/collection/list
use aiken/primitive/bytearray.{concat}
use cardano/address.{from_script}
use cardano/assets.{AssetName, PolicyId, flatten, from_asset, without_lovelace}
use cardano/transaction.{OutputReference, Transaction} as tx
use cip.{cip68_100_prefix, cip68_222, cip68_222_prefix}
use cocktail/vodka_converter.{convert_int_to_bytes}
use mocktail.{
  add_output, complete, mint, mock_pub_key_address, mock_tx_hash, mocktail_tx,
  ref_tx_in, ref_tx_in_inline_datum, required_signer_hash,
}
use mocktail/virgin_key_hash.{mock_policy_id, mock_pub_key_hash}
use mocktail/virgin_outputs.{mock_script_output}
use oracle_token_type.{OracleDatum}
use oracle_token_util.{get_oracle_nft_datum}

validator update_identity_token(oracle_nft: (PolicyId, AssetName)) {
  spend(_d, _r, own_ref: OutputReference, transaction: Transaction) {
    let Transaction { inputs, reference_inputs, .. } = transaction

    expect oracle_input_datum: OracleDatum =
      reference_inputs |> get_oracle_nft_datum(oracle_nft)
    expect Some(own_input) =
      inputs |> list.find(fn(input) { input.output_reference == own_ref })
    expect [(policy_id, ref_asset_name, _)] =
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
    let bounty_nft_check =
      (
        inputs
          |> list.filter(
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
          |> list.length()
      ) == 1
    name_check? && bounty_nft_check?
  }

  else(_) {
    fail
  }
}

test success_spend_identity_token() {
  let tx: Transaction =
    mocktail_tx()
      |> ref_tx_in(
          True,
          mock_tx_hash(0),
          0,
          from_asset(mock_policy_id(2), "oracle", 1),
          from_script("ref_token_hold"),
        )
      |> ref_tx_in_inline_datum(
          True,
          OracleDatum {
            bounty_token_policy_id: mock_policy_id(0),
            bounty_board_address: from_script("bounty_board_hold"),
            id_token_policy_id: mock_policy_id(1),
            id_token_store_address: from_script("ref_token_hold"),
            owner: mock_pub_key_address(0, None),
          },
        )
      |> complete()

  // InlineDatum(redeemer),
  update_identity_token.spend()
}
