use aiken/collection/list
use aiken/primitive/bytearray.{concat}
use cardano/address.{from_script}
use cardano/assets.{AssetName, PolicyId, from_asset}
use cardano/transaction.{OutputReference, Transaction, find_input} as tx
use cip.{cip68_100, cip68_222}
use cocktail.{
  convert_int_to_bytes, inputs_with, inputs_with_policy, value_policy_info,
  value_tokens,
}
use cocktail/vodka_inputs.{inputs_at}
use identity_token_type.{ContributerDatum}
use mocktail.{
  complete, mint, mock_policy_id, mock_pub_key_address, mock_pub_key_hash,
  mock_script_address, mock_tx_hash, mocktail_tx, ref_tx_in,
  ref_tx_in_inline_datum, tx_in, tx_in_inline_datum,
}
use oracle_token_type.{OracleDatum}
use oracle_token_util.{get_oracle_nft_datum}

validator intent_ref_token_holder(oracle_nft: (PolicyId, AssetName)) {
  spend(_datum, _redeemer, input: OutputReference, transaction: Transaction) {
    let Transaction { inputs, reference_inputs, mint, .. } = transaction

    let oracle_input_datum: OracleDatum =
      reference_inputs |> get_oracle_nft_datum(oracle_nft)

    expect Some(own_input) = find_input(inputs, input)
    let script_inputs =
      inputs_at(inputs, own_input.output.address) |> list.length()

    let is_only_one_script_input = script_inputs == 1
    expect [(intent_policy_id, _, _)] = value_tokens(own_input.output.value)

    expect [(only_burn_policy, _, only_burn_quantity)] = value_tokens(mint)
    let is_intent_completed =
      only_burn_policy == intent_policy_id && only_burn_quantity == -1

    is_intent_completed? && is_only_one_script_input?
  }

  else(_) {
    fail
  }
}

type SpendTestCase {
  is_oracle_inputed: Bool,
  is_ref_token_name_correct: Bool,
  is_id_nft_check: Bool,
  is_bounty_nft_check: Bool,
}

fn mock_spend_tx(test_case: SpendTestCase) -> Transaction {
  let SpendTestCase {
    is_oracle_inputed,
    is_ref_token_name_correct,
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
          intent_token_policy_id: mock_policy_id(2),
          intent_token_store_address: from_script("intent_token_hold"),
          owner: mock_pub_key_address(0, None),
        },
      )
    |> tx_in(
        is_ref_token_name_correct,
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
        ContributerDatum {
          metadata: [],
          version: 1,
          contributions: [],
          pub_key_hash: mock_pub_key_hash(0),
        },
      )
    |> tx_in(
        is_bounty_nft_check,
        mock_tx_hash(0),
        0,
        from_asset(mock_policy_id(0), "bounty", 1),
        from_script("bounty_board_hold"),
      )
    |> mint(True, -1, mock_policy_id(0), "bounty")
    |> complete()
}

test success_spend_identity_token() {
  let tx =
    mock_spend_tx(
      SpendTestCase {
        is_oracle_inputed: True,
        is_ref_token_name_correct: True,
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
        is_ref_token_name_correct: False,
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
        is_ref_token_name_correct: True,
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
        is_ref_token_name_correct: True,
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
        is_ref_token_name_correct: True,
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
