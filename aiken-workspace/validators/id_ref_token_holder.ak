use aiken/collection/list
use aiken/primitive/bytearray.{concat}
use cardano/address.{from_script}
use cardano/assets.{AssetName, PolicyId, flatten, from_asset, without_lovelace}
use cardano/transaction.{OutputReference, Transaction} as tx
use cip.{cip68_222}
use cocktail.{convert_int_to_bytes}
use identity_token_type.{ContributerDatum}
use mocktail.{
  complete, mock_policy_id, mock_pub_key_address, mock_script_address,
  mock_tx_hash, mocktail_tx, ref_tx_in, ref_tx_in_inline_datum, tx_in,
  tx_in_inline_datum,
}
use oracle_token_type.{OracleDatum}
use oracle_token_util.{get_oracle_nft_datum}

validator update_identity_token(oracle_nft: (PolicyId, AssetName)) {
  spend(_d, _r, own_ref: OutputReference, transaction: Transaction) {
    let Transaction { inputs, reference_inputs, .. } = transaction

    let oracle_input_datum: OracleDatum =
      reference_inputs |> get_oracle_nft_datum(oracle_nft)
    expect Some(own_input) =
      inputs |> list.find(fn(input) { input.output_reference == own_ref })
    expect [(policy_id, ref_asset_name, _)] =
      own_input.output.value |> without_lovelace() |> flatten()

    let name_check =
      ref_asset_name |> bytearray.starts_with(prefix: cip.cip68_100_prefix)

    // Get NFT AssetName
    let nft_asset_name = ref_asset_name |> bytearray.drop(n: 4) |> cip68_222()

    let id_nft_input =
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

    let id_nft_check = id_nft_input != None

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
    name_check? && id_nft_check? && bounty_nft_check?
  }

  else(_) {
    fail
  }
}

type SpendTestCase {
  is_oracle_inputed: Bool,
  is_name_check: Bool,
  is_id_nft_check: Bool,
  is_bounty_nft_check: Bool,
}

fn mock_spend_tx(test_case: SpendTestCase) -> Transaction {
  let SpendTestCase {
    is_oracle_inputed,
    is_name_check,
    is_id_nft_check,
    is_bounty_nft_check,
  } = test_case

  mocktail_tx()
    |> ref_tx_in(
        is_oracle_inputed,
        mock_tx_hash(0),
        0,
        from_asset(mock_policy_id(2), "oracle", 1),
        from_script("ref_token_hold"),
      )
    |> ref_tx_in_inline_datum(
        is_oracle_inputed,
        OracleDatum {
          bounty_token_policy_id: mock_policy_id(0),
          bounty_board_address: from_script("bounty_board_hold"),
          id_token_policy_id: mock_policy_id(1),
          id_token_store_address: from_script("ref_token_hold"),
          owner: mock_pub_key_address(0, None),
        },
      )
    |> tx_in(
        is_name_check,
        mock_tx_hash(1),
        0,
        from_asset(
          mock_policy_id(1),
          bytearray.concat(#"000643b0", "id")
            |> concat(convert_int_to_bytes(10)),
          1,
        ),
        from_script("ref_token_hold"),
      )
    |> tx_in(
        is_id_nft_check,
        mock_tx_hash(0),
        0,
        from_asset(
          mock_policy_id(1),
          bytearray.concat(#"000de140", "id")
            |> concat(convert_int_to_bytes(10)),
          1,
        ),
        mock_script_address(0, None),
      )
    |> tx_in_inline_datum(
        is_id_nft_check,
        ContributerDatum { github: @"abc", contributions: [] },
      )
    |> tx_in(
        is_bounty_nft_check,
        mock_tx_hash(0),
        0,
        from_asset(mock_policy_id(0), "bounty", 1),
        from_script("bounty_board_hold"),
      )
    |> complete()
}

test success_spend_identity_token() {
  let tx =
    mock_spend_tx(
      SpendTestCase {
        is_oracle_inputed: True,
        is_name_check: True,
        is_id_nft_check: True,
        is_bounty_nft_check: True,
      },
    )

  update_identity_token.spend(
    (mock_policy_id(2), "oracle"),
    None,
    "",
    OutputReference { transaction_id: mock_tx_hash(1), output_index: 0 },
    tx,
  )
}

test fail_spend_identity_token_with_wrong_name() fail {
  let tx =
    mock_spend_tx(
      SpendTestCase {
        is_oracle_inputed: True,
        is_name_check: False,
        is_id_nft_check: True,
        is_bounty_nft_check: True,
      },
    )

  update_identity_token.spend(
    (mock_policy_id(2), "oracle"),
    None,
    "",
    OutputReference { transaction_id: mock_tx_hash(1), output_index: 0 },
    tx,
  )
}

test fail_spend_identity_token_with_no_oracle() fail {
  let tx =
    mock_spend_tx(
      SpendTestCase {
        is_oracle_inputed: False,
        is_name_check: True,
        is_id_nft_check: True,
        is_bounty_nft_check: True,
      },
    )

  update_identity_token.spend(
    (mock_policy_id(2), "oracle"),
    None,
    "",
    OutputReference { transaction_id: mock_tx_hash(1), output_index: 0 },
    tx,
  )
}

test fail_spend_identity_token_with_no_id_nft() fail {
  let tx =
    mock_spend_tx(
      SpendTestCase {
        is_oracle_inputed: True,
        is_name_check: True,
        is_id_nft_check: False,
        is_bounty_nft_check: True,
      },
    )

  update_identity_token.spend(
    (mock_policy_id(2), "oracle"),
    None,
    "",
    OutputReference { transaction_id: mock_tx_hash(1), output_index: 0 },
    tx,
  )
}

test fail_spend_identity_token_with_no_bounty_nft() fail {
  let tx =
    mock_spend_tx(
      SpendTestCase {
        is_oracle_inputed: True,
        is_name_check: True,
        is_id_nft_check: True,
        is_bounty_nft_check: False,
      },
    )

  update_identity_token.spend(
    (mock_policy_id(2), "oracle"),
    None,
    "",
    OutputReference { transaction_id: mock_tx_hash(1), output_index: 0 },
    tx,
  )
}
