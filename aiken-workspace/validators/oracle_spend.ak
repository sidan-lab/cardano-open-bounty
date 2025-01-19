use cardano/address.{from_script}
use cardano/assets.{add, from_asset}
use cardano/transaction.{Input,
  Output, OutputReference, Transaction, find_input}
use cocktail.{
  address_payment_key, inputs_at_with_policy, key_signed, only_minted_token,
  outputs_at_with_policy, value_length, value_tokens,
}
use cocktail/vodka_outputs.{output_inline_datum}
use mocktail.{
  complete, mint, mock_policy_id, mock_pub_key_address, mock_pub_key_hash,
  mock_script_address, mock_tx_hash, mock_utxo_ref, mocktail_tx,
  required_signer_hash, tx_in, tx_in_inline_datum, tx_out, tx_out_inline_datum,
}
use oracle_token_type.{OracleDatum, OracleRedeemer, StopOracle, UpdateOracle}

validator oracle {
  spend(
    datum_opt: Option<OracleDatum>,
    redeemer: OracleRedeemer,
    input: OutputReference,
    tx: Transaction,
  ) {
    let Transaction { mint, inputs, outputs, extra_signatories, .. } = tx
    expect Some(OracleDatum { owner, .. }) = datum_opt
    expect Some(own_input) = find_input(inputs, input)
    expect [(oracle_nft_policy, _, _)] = value_tokens(own_input.output.value)
    let own_address = own_input.output.address
    let owner_key = address_payment_key(owner)
    let is_owner_signed = key_signed(extra_signatories, owner_key)
    when
      (
        redeemer,
        inputs_at_with_policy(inputs, own_address, oracle_nft_policy),
        outputs_at_with_policy(outputs, own_address, oracle_nft_policy),
      )
    is {
      (UpdateOracle, [_], [only_output]) -> {
        let is_output_value_clean = value_length(only_output.value) == 2
        expect _: OracleDatum = output_inline_datum(only_output)
        is_output_value_clean? && is_owner_signed?
      }
      (StopOracle, [_], _) ->
        only_minted_token(mint, oracle_nft_policy, "", -1) && is_owner_signed?
      _ -> False
    }
  }

  else(_) {
    fail
  }
}

type MintTestCase {
  is_oracle_output_clean: Bool,
  is_datum_format_correct: Bool,
}

const mock_oracle_datum: OracleDatum =
  OracleDatum {
    bounty_token_policy_id: mock_policy_id(0),
    bounty_board_address: from_script("bounty_board_hold"),
    id_token_policy_id: mock_policy_id(1),
    id_token_store_address: from_script("ref_token_hold"),
    owner: mock_pub_key_address(0, None),
  }

fn mock_mint_tx(test_case: MintTestCase) -> Transaction {
  let MintTestCase { is_oracle_output_clean, is_datum_format_correct } =
    test_case

  let input_value =
    from_asset(mock_policy_id(0), "", 1) |> add("", "", 2_000_000)

  mocktail_tx()
    |> tx_in(True, mock_tx_hash(0), 0, input_value, mock_script_address(0, None))
    |> tx_in_inline_datum(True, mock_oracle_datum)
    |> tx_out(is_oracle_output_clean, mock_script_address(0, None), input_value)
    |> tx_out(
        !is_oracle_output_clean,
        mock_script_address(0, None),
        input_value |> add(mock_policy_id(1), "", 1),
      )
    |> tx_out_inline_datum(is_datum_format_correct, mock_oracle_datum)
    |> tx_out_inline_datum(!is_datum_format_correct, UpdateOracle)
    |> mint(True, 1, mock_policy_id(1), "collection (0)")
    |> required_signer_hash(True, mock_pub_key_hash(0))
    |> complete()
}

test success_mint() {
  let datum = mock_oracle_datum
  let redeemer = UpdateOracle
  let tx =
    mock_mint_tx(
      MintTestCase {
        is_oracle_output_clean: True,
        is_datum_format_correct: True,
      },
    )

  oracle.spend(Some(datum), redeemer, mock_utxo_ref(0, 0), tx)
}

test fail_mint_with_unclean_output() {
  let datum = mock_oracle_datum
  let redeemer = UpdateOracle

  let tx =
    mock_mint_tx(
      MintTestCase {
        is_oracle_output_clean: False,
        is_datum_format_correct: True,
      },
    )

  !oracle.spend(Some(datum), redeemer, mock_utxo_ref(0, 0), tx)
}

test fail_mint_with_incorrect_new_datum() fail {
  let datum = mock_oracle_datum
  let redeemer = UpdateOracle

  let tx =
    mock_mint_tx(
      MintTestCase {
        is_oracle_output_clean: True,
        is_datum_format_correct: False,
      },
    )

  !oracle.spend(Some(datum), redeemer, mock_utxo_ref(0, 0), tx)
}

type StopOracleTestCase {
  is_oracle_nft_burnt: Bool,
}

fn mock_stop_oracle_tx(test_case: StopOracleTestCase) -> Transaction {
  let StopOracleTestCase { is_oracle_nft_burnt } = test_case

  let input_value = from_asset(mock_policy_id(0), "", 1)

  mocktail_tx()
    |> tx_in(True, mock_tx_hash(0), 0, input_value, mock_script_address(0, None))
    |> tx_in_inline_datum(True, mock_oracle_datum)
    |> mint(is_oracle_nft_burnt, -1, mock_policy_id(0), "")
    |> required_signer_hash(True, mock_pub_key_hash(0))
    |> complete()
}

test success_stop() {
  let datum = mock_oracle_datum
  let redeemer = StopOracle
  let tx = mock_stop_oracle_tx(StopOracleTestCase { is_oracle_nft_burnt: True })

  oracle.spend(Some(datum), redeemer, mock_utxo_ref(0, 0), tx)
}

test fail_stop_with_oracle_nft_not_burnt() {
  let datum = mock_oracle_datum
  let redeemer = StopOracle

  let tx =
    mock_stop_oracle_tx(StopOracleTestCase { is_oracle_nft_burnt: False })

  !oracle.spend(Some(datum), redeemer, mock_utxo_ref(0, 0), tx)
}
