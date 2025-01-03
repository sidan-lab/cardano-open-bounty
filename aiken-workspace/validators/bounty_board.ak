use aiken/collection/list
use aiken/primitive/bytearray.{concat}
use bounty_token_type.{BountyDatum, to_bounty_datum}
use bounty_token_util.{has_all_signers}
use cardano/address.{from_script}
use cardano/assets.{
  AssetName, PolicyId, from_asset, from_lovelace, lovelace_of, merge,
  quantity_of,
}
use cardano/transaction.{InlineDatum, OutputReference, Transaction} as tx
use cocktail/vodka_converter.{convert_int_to_bytes}
use cocktail/vodka_mints.{only_minted_token}
use mocktail.{
  add_extra_signatory, add_output, complete, mock_pub_key_address,
  mock_pub_key_hash, mock_script_address, mock_script_output, mock_tx_hash,
  mocktail_tx, ref_tx_in, ref_tx_in_inline_datum, tx_in, tx_in_inline_datum,
}
use mocktail/virgin_key_hash.{mock_policy_id}
use oracle_token_type.{OracleDatum}
use oracle_token_util.{get_oracle_nft_datum}

pub type BountyBoradRedeemer {
  UpdateBounty
  RedeemBounty
}

validator bounty_board(oracle_nft: (PolicyId, AssetName)) {
  spend(
    _d,
    redeemer: BountyBoradRedeemer,
    own_ref: OutputReference,
    transaction: Transaction,
  ) {
    let Transaction {
      mint,
      outputs,
      inputs,
      reference_inputs,
      extra_signatories,
      ..
    } = transaction
    let input_check = list.length(inputs) == 1

    expect oracle_input_datum: OracleDatum =
      reference_inputs |> get_oracle_nft_datum(oracle_nft)
    expect Some(own_input) =
      inputs |> list.find(fn(input) { input.output_reference == own_ref })

    let redeemer_check =
      when redeemer is {
        UpdateBounty -> {
          let old_bounty_datum: BountyDatum =
            own_input.output.datum |> to_bounty_datum()
          let signatories_check =
            has_all_signers(old_bounty_datum.all_signatories, extra_signatories)

          expect Some(bounty_nft_output) =
            outputs
              |> list.find(
                  fn(output) {
                    let address_check =
                      (output.address == oracle_input_datum.bounty_board_address)?

                    let datum = output.datum |> to_bounty_datum()
                    let datum_check =
                      (lovelace_of(output.value) >= datum.reward)?
                    let bounty_token_check =
                      (
                        output.value
                          |> quantity_of(
                              oracle_input_datum.bounty_token_policy_id,
                              "",
                            )
                      ) == 1
                    address_check && datum_check && bounty_token_check
                  },
                )

          signatories_check?
        }
        RedeemBounty ->
          only_minted_token(
            mint,
            oracle_input_datum.bounty_token_policy_id,
            "",
            -1,
          )
      }

    input_check? && redeemer_check?
  }

  else(_) {
    fail
  }
}

type SpendTestCase {
  is_oracle_inputed: Bool,
  is_input_check: Bool,
  is_signatories_check: Bool,
  is_datum_check: Bool,
  is_redeemer_check: Bool,
}

fn mock_spend_tx(test_case: SpendTestCase) -> Transaction {
  let SpendTestCase {
    is_oracle_inputed,
    is_input_check,
    is_signatories_check,
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
          owner: mock_pub_key_address(0, None),
        },
      )
    |> tx_in(
        is_redeemer_check,
        mock_tx_hash(1),
        0,
        from_asset(mock_policy_id(0), "", 1),
        from_script("bounty_board_hold"),
      )
    |> tx_in_inline_datum(
        is_redeemer_check,
        BountyDatum {
          issue_url: [],
          reward: 100000000000,
          all_signatories: [mock_pub_key_hash(0), mock_pub_key_hash(1)],
        },
      )
    |> tx_in(
        !is_input_check,
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
    |> complete()
    |> add_extra_signatory(is_signatories_check, mock_pub_key_hash(0))
    |> add_extra_signatory(True, mock_pub_key_hash(1))
    |> add_output(
        is_datum_check,
        mock_script_output(
          from_script("bounty_board_hold"),
          merge(
            from_lovelace(100000000000),
            from_asset(mock_policy_id(0), "", 1),
          ),
          InlineDatum(
            BountyDatum {
              issue_url: [],
              reward: 100000000000,
              all_signatories: [
                mock_pub_key_hash(0),
                mock_pub_key_hash(1),
                mock_pub_key_hash(2),
              ],
            },
          ),
        ),
      )
}

test success_update_bounty_board() {
  let tx =
    mock_spend_tx(
      SpendTestCase {
        is_oracle_inputed: True,
        is_input_check: True,
        is_signatories_check: True,
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
        is_signatories_check: True,
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

test fail_update_bounty_board_with_two_inputs() fail {
  let tx =
    mock_spend_tx(
      SpendTestCase {
        is_oracle_inputed: True,
        is_input_check: False,
        is_signatories_check: True,
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

test fail_update_bounty_board_with_no_sign() fail {
  let tx =
    mock_spend_tx(
      SpendTestCase {
        is_oracle_inputed: True,
        is_input_check: True,
        is_signatories_check: False,
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
        is_signatories_check: True,
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
        is_signatories_check: True,
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
