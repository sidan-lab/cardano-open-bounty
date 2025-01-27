use aiken/collection/list
use aiken/primitive/bytearray.{concat}
use bounty_token_type.{BountyDatum, to_bounty_datum}
use cardano/address.{from_script}
use cardano/assets.{
  AssetName, PolicyId, from_asset, from_lovelace, lovelace_of, merge,
}
use cardano/transaction.{InlineDatum,
  OutputReference, Transaction, find_input} as tx
use cip.{cip68_222}
use cocktail.{
  convert_int_to_bytes, inputs_at, only_minted_token, outputs_at_with,
  value_tokens,
}
use identity_token_util.{is_token_provided}
use mocktail.{
  add_extra_signatory, add_output, complete, mock_policy_id,
  mock_pub_key_address, mock_pub_key_hash, mock_script_output, mock_tx_hash,
  mocktail_tx, ref_tx_in, ref_tx_in_inline_datum, tx_in, tx_in_inline_datum,
}
use oracle_token_type.{OracleDatum}
use oracle_token_util.{get_oracle_nft_datum}

pub type BountyBoradRedeemer {
  UpdateBounty
  RedeemBounty
}

validator bounty_board(oracle_nft: (PolicyId, AssetName)) {
  spend(
    _datum,
    redeemer: BountyBoradRedeemer,
    input: OutputReference,
    transaction: Transaction,
  ) {
    let Transaction { mint, outputs, inputs, reference_inputs, .. } =
      transaction

    let oracle_input_datum: OracleDatum =
      reference_inputs |> get_oracle_nft_datum(oracle_nft)

    expect Some(own_input) = find_input(inputs, input)
    let script_inputs =
      inputs_at(inputs, own_input.output.address) |> list.length()

    let is_only_one_script_input = script_inputs == 1
    expect [(_, asset_name, _)] = own_input.output.value |> value_tokens()

    when redeemer is {
      UpdateBounty -> {
        expect [bounty_board_output] =
          outputs_at_with(
            outputs,
            oracle_input_datum.bounty_board_address,
            oracle_input_datum.bounty_token_policy_id,
            asset_name,
          )

        let is_id_token_provided =
          is_token_provided(
            inputs,
            oracle_input_datum.id_token_policy_id,
            cip68_222(asset_name),
          )
        let datum = bounty_board_output.datum |> to_bounty_datum()
        let datum_check =
          (lovelace_of(bounty_board_output.value) >= datum.reward)?
        is_id_token_provided? && is_only_one_script_input? && datum_check
      }
      RedeemBounty ->
        only_minted_token(
          mint,
          oracle_input_datum.bounty_token_policy_id,
          asset_name,
          -1,
        )
    }
  }

  else(_) {
    fail
  }
}

type SpendTestCase {
  is_oracle_inputed: Bool,
  is_input_check: Bool,
  is_datum_check: Bool,
  is_redeemer_check: Bool,
}

fn mock_spend_tx(test_case: SpendTestCase) -> Transaction {
  let SpendTestCase {
    is_oracle_inputed,
    is_input_check,
    is_datum_check,
    is_redeemer_check,
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
        is_redeemer_check,
        mock_tx_hash(1),
        0,
        from_asset(mock_policy_id(0), "bounty", 1),
        from_script("bounty_board_hold"),
      )
    |> tx_in_inline_datum(
        is_redeemer_check,
        BountyDatum { issue_url: [], reward: 100000000000 },
      )
    |> tx_in(
        !is_input_check,
        mock_tx_hash(0),
        0,
        from_asset(
          mock_policy_id(1),
          cip68_222("bounty")
            |> concat(convert_int_to_bytes(10)),
          1,
        ),
        from_script("bounty_board_hold"),
      )
    |> tx_in(
        True,
        mock_tx_hash(0),
        0,
        merge(
          from_lovelace(100000000000),
          from_asset(mock_policy_id(1), cip.cip68_222("bounty"), 1),
        ),
        from_script("contributor"),
      )
    |> complete()
    |> add_extra_signatory(True, mock_pub_key_hash(1))
    |> add_output(
        is_datum_check,
        mock_script_output(
          from_script("bounty_board_hold"),
          merge(
            from_lovelace(100000000000),
            from_asset(mock_policy_id(0), "bounty", 1),
          ),
          InlineDatum(BountyDatum { issue_url: [], reward: 100000000000 }),
        ),
      )
}

test success_update_bounty_board() {
  let tx =
    mock_spend_tx(
      SpendTestCase {
        is_oracle_inputed: True,
        is_input_check: True,
        is_datum_check: True,
        is_redeemer_check: True,
      },
    )

  bounty_board.spend(
    (mock_policy_id(2), "oracle"),
    None,
    UpdateBounty,
    OutputReference { transaction_id: mock_tx_hash(1), output_index: 0 },
    tx,
  )
}

test fail_update_bounty_board_with_no_oracle() fail {
  let tx =
    mock_spend_tx(
      SpendTestCase {
        is_oracle_inputed: False,
        is_input_check: True,
        is_datum_check: True,
        is_redeemer_check: True,
      },
    )

  bounty_board.spend(
    (mock_policy_id(2), "oracle"),
    None,
    UpdateBounty,
    OutputReference { transaction_id: mock_tx_hash(1), output_index: 0 },
    tx,
  )
}

test fail_update_bounty_board_with_two_script_inputs() fail {
  let tx =
    mock_spend_tx(
      SpendTestCase {
        is_oracle_inputed: True,
        is_input_check: False,
        is_datum_check: True,
        is_redeemer_check: True,
      },
    )

  bounty_board.spend(
    (mock_policy_id(2), "oracle"),
    None,
    UpdateBounty,
    OutputReference { transaction_id: mock_tx_hash(1), output_index: 0 },
    tx,
  )
}

test fail_update_bounty_board_with_no_datumn() fail {
  let tx =
    mock_spend_tx(
      SpendTestCase {
        is_oracle_inputed: True,
        is_input_check: True,
        is_datum_check: False,
        is_redeemer_check: True,
      },
    )

  bounty_board.spend(
    (mock_policy_id(2), "oracle"),
    None,
    UpdateBounty,
    OutputReference { transaction_id: mock_tx_hash(1), output_index: 0 },
    tx,
  )
}

test fail_update_bounty_board_with_no_redeemer() fail {
  let tx =
    mock_spend_tx(
      SpendTestCase {
        is_oracle_inputed: True,
        is_input_check: True,
        is_datum_check: True,
        is_redeemer_check: False,
      },
    )

  bounty_board.spend(
    (mock_policy_id(2), "oracle"),
    None,
    UpdateBounty,
    OutputReference { transaction_id: mock_tx_hash(1), output_index: 0 },
    tx,
  )
}
