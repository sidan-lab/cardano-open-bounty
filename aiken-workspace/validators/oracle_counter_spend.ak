use aiken/collection/list
use cardano/assets.{add, flatten, from_asset}
use cardano/transaction.{
  InlineDatum, Input, Output, OutputReference, Transaction, find_input,
}
use cocktail/vodka_address.{address_payment_key}
use cocktail/vodka_extra_signatories.{key_signed}
use cocktail/vodka_inputs.{inputs_at_with_policy}
use cocktail/vodka_mints.{only_minted_token}
use cocktail/vodka_outputs.{outputs_at_with_policy}
use mocktail.{
  complete, mint, mocktail_tx, required_signer_hash, tx_in, tx_in_inline_datum,
  tx_out, tx_out_inline_datum,
}
use mocktail/virgin_address.{mock_pub_key_address, mock_script_address}
use mocktail/virgin_key_hash.{mock_policy_id, mock_pub_key_hash}
use mocktail/virgin_output_reference.{mock_tx_hash, mock_utxo_ref}
use oracle_token_type.{MintNFT, OracleCounterDatum, OracleRedeemer, StopOracle}

validator oracle_counter {
  spend(
    datum_opt: Option<OracleCounterDatum>,
    redeemer: OracleRedeemer,
    input: OutputReference,
    tx: Transaction,
  ) {
    let Transaction { mint, inputs, outputs, extra_signatories, .. } = tx
    expect Some(OracleCounterDatum { count, owner }) = datum_opt
    expect Some(own_input) = find_input(inputs, input)
    expect [(oracle_nft_policy, _, _)] =
      list.filter(flatten(own_input.output.value), fn(x) { x.1st != "" })
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
      (MintNFT, [_], [only_output]) -> {
        let is_output_value_clean = list.length(flatten(only_output.value)) == 2
        let is_count_updated =
          only_output.datum == InlineDatum(
            OracleCounterDatum { count: count + 1, owner },
          )
        is_output_value_clean? && is_count_updated? && is_owner_signed?
      }
      (StopOracle, [_], _) -> {
        let is_oracle_nft_burnt =
          only_minted_token(mint, oracle_nft_policy, "", -1)

        is_oracle_nft_burnt? && is_owner_signed?
      }
      _ -> False
    }
  }

  else(_) {
    fail
  }
}

type MintTestCase {
  is_oracle_output_clean: Bool,
  is_count_updated: Bool,
}

fn mock_mint_tx(test_case: MintTestCase) -> Transaction {
  let MintTestCase { is_oracle_output_clean, is_count_updated } = test_case

  let input_value =
    from_asset(mock_policy_id(0), "", 1) |> add("", "", 2_000_000)

  mocktail_tx()
    |> tx_in(True, mock_tx_hash(0), 0, input_value, mock_script_address(0, None))
    |> tx_in_inline_datum(
        True,
        OracleCounterDatum { count: 0, owner: mock_pub_key_address(0, None) },
      )
    |> tx_out(is_oracle_output_clean, mock_script_address(0, None), input_value)
    |> tx_out(
        !is_oracle_output_clean,
        mock_script_address(0, None),
        input_value |> add(mock_policy_id(1), "", 1),
      )
    |> tx_out_inline_datum(
        True,
        OracleCounterDatum {
          count: if is_count_updated {
            1
          } else {
            0
          },
          owner: mock_pub_key_address(0, None),
        },
      )
    |> mint(True, 1, mock_policy_id(1), "collection (0)")
    |> required_signer_hash(True, mock_pub_key_hash(0))
    |> complete()
}

test success_mint() {
  let datum =
    OracleCounterDatum { count: 0, owner: mock_pub_key_address(0, None) }

  let redeemer = MintNFT
  let tx =
    mock_mint_tx(
      MintTestCase { is_oracle_output_clean: True, is_count_updated: True },
    )

  oracle_counter.spend(Some(datum), redeemer, mock_utxo_ref(0, 0), tx)
}

test fail_mint_with_unclean_output() {
  let datum =
    OracleCounterDatum { count: 0, owner: mock_pub_key_address(0, None) }
  let redeemer = MintNFT

  let tx =
    mock_mint_tx(
      MintTestCase { is_oracle_output_clean: False, is_count_updated: True },
    )

  !oracle_counter.spend(Some(datum), redeemer, mock_utxo_ref(0, 0), tx)
}

test fail_mint_without_count_updated() {
  let datum =
    OracleCounterDatum { count: 0, owner: mock_pub_key_address(0, None) }
  let redeemer = MintNFT

  let tx =
    mock_mint_tx(
      MintTestCase { is_oracle_output_clean: True, is_count_updated: False },
    )

  !oracle_counter.spend(Some(datum), redeemer, mock_utxo_ref(0, 0), tx)
}

type StopOracleTestCase {
  is_oracle_nft_burnt: Bool,
}

fn mock_stop_oracle_tx(test_case: StopOracleTestCase) -> Transaction {
  let StopOracleTestCase { is_oracle_nft_burnt } = test_case

  let input_value = from_asset(mock_policy_id(0), "", 1)

  mocktail_tx()
    |> tx_in(True, mock_tx_hash(0), 0, input_value, mock_script_address(0, None))
    |> tx_in_inline_datum(
        True,
        OracleCounterDatum { count: 0, owner: mock_pub_key_address(0, None) },
      )
    |> mint(is_oracle_nft_burnt, -1, mock_policy_id(0), "")
    |> required_signer_hash(True, mock_pub_key_hash(0))
    |> complete()
}

test success_stop() {
  let datum =
    OracleCounterDatum { count: 0, owner: mock_pub_key_address(0, None) }
  let redeemer = StopOracle
  let tx = mock_stop_oracle_tx(StopOracleTestCase { is_oracle_nft_burnt: True })

  oracle_counter.spend(Some(datum), redeemer, mock_utxo_ref(0, 0), tx)
}

test fail_stop_with_oracle_nft_not_burnt() {
  let datum =
    OracleCounterDatum { count: 0, owner: mock_pub_key_address(0, None) }

  let redeemer = StopOracle

  let tx =
    mock_stop_oracle_tx(StopOracleTestCase { is_oracle_nft_burnt: False })

  !oracle_counter.spend(Some(datum), redeemer, mock_utxo_ref(0, 0), tx)
}
