use aiken/collection/list
use aiken/primitive/bytearray.{concat}
use cardano/address.{from_script}
use cardano/assets.{AssetName, PolicyId, from_asset}
use cardano/transaction.{OutputReference, Transaction, find_input} as tx
use cip.{cip68_100, cip68_222}
use cocktail.{convert_int_to_bytes, inputs_with}
use cocktail/vodka_inputs.{inputs_with_policy}
use cocktail/vodka_value.{value_tokens}
use identity_token_type.{ContributerDatum}
use mocktail.{
  complete, mock_policy_id, mock_pub_key_address, mock_script_address,
  mock_tx_hash, mocktail_tx, ref_tx_in, ref_tx_in_inline_datum, tx_in,
  tx_in_inline_datum,
}
use oracle_token_type.{OracleDatum}
use oracle_token_util.{get_oracle_nft_datum}

validator id_ref_token_holder(oracle_nft: (PolicyId, AssetName)) {
  spend(_d, _r, input: OutputReference, transaction: Transaction) {
    let Transaction { inputs, reference_inputs, .. } = transaction

    let oracle_input_datum: OracleDatum =
      reference_inputs |> get_oracle_nft_datum(oracle_nft)
    expect Some(own_input) = find_input(inputs, input)
    expect [(policy_id, ref_asset_name, _)] =
      value_tokens(own_input.output.value)

    let name_check =
      ref_asset_name |> bytearray.starts_with(prefix: cip.cip68_100_prefix)

    // Get NFT AssetName
    let nft_asset_name = ref_asset_name |> bytearray.drop(4) |> cip68_222()

    expect [_id_nft_input] = inputs_with(inputs, policy_id, nft_asset_name)

    let bounty_token_inputs_length =
      inputs_with_policy(inputs, oracle_input_datum.bounty_token_policy_id)
        |> list.length()

    let bounty_nft_check = bounty_token_inputs_length == 1
    name_check? && bounty_nft_check?
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
          cip68_100("id")
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
          cip68_222("id")
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

  id_ref_token_holder.spend(
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

  id_ref_token_holder.spend(
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

  id_ref_token_holder.spend(
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

  id_ref_token_holder.spend(
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

  id_ref_token_holder.spend(
    (mock_policy_id(2), "oracle"),
    None,
    "",
    OutputReference { transaction_id: mock_tx_hash(1), output_index: 0 },
    tx,
  )
}
