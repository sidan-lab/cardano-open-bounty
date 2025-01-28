use aiken/primitive/bytearray.{concat}
use cardano/address.{VerificationKey, from_script}
use cardano/assets.{
  AssetName, PolicyId, from_asset, from_lovelace, merge, quantity_of,
}
use cardano/transaction.{InlineDatum, Transaction} as tx
use cip.{cip68_100, cip68_222}
use cocktail.{
  convert_int_to_bytes, inputs_at_with, outputs_at_with, value_policy_info,
  value_tokens,
}
use cocktail/vodka_extra_signatories.{key_signed}
use identity_token_type.{
  CheckBurn, CheckMint, ContributerDatum, IdRedeemr, to_contributer_datum,
}
use identity_token_util.{is_token_provided}
use intent_token_type.{
  AccpetRedeem, CancelRedeem, IntentDatum, IntentRedeemr, RedeemBounty,
  to_intent_datum,
}
use mocktail.{
  add_output, complete, mint, mock_policy_id, mock_pub_key_address,
  mock_pub_key_hash, mock_script_output, mock_tx_hash, mocktail_tx, ref_tx_in,
  ref_tx_in_inline_datum, required_signer_hash, tx_in, tx_in_inline_datum,
}
use mocktail/virgin_output_reference.{mock_utxo_ref}
use oracle_token_type.{OracleCounterDatum, OracleDatum}
use oracle_token_util.{get_oracle_counter_datum, get_oracle_nft_datum}

validator intent_token(oracle_nft: (PolicyId, AssetName)) {
  mint(redeemer: IntentRedeemr, policy_id: PolicyId, transaction: Transaction) {
    let Transaction {
      mint,
      outputs,
      reference_inputs,
      inputs,
      extra_signatories,
      ..
    } = transaction

    let oracle_input_datum: OracleDatum =
      reference_inputs |> get_oracle_nft_datum(oracle_nft)

    when redeemer is {
      RedeemBounty(contributor_address) -> {
        expect [(only_mint_policy_id, only_mint_asset_name, only_mint_quantity)] =
          value_tokens(mint)
        let is_id_token_provided =
          is_token_provided(
            inputs,
            oracle_input_datum.id_token_policy_id,
            cip68_222(only_mint_asset_name),
          )
        expect [bounty_input] =
          inputs_at_with(
            inputs,
            oracle_input_datum.bounty_board_address,
            oracle_input_datum.bounty_token_policy_id,
            only_mint_asset_name,
          )
        expect [intent_output] =
          outputs_at_with(
            outputs,
            oracle_input_datum.intent_token_store_address,
            only_mint_policy_id,
            only_mint_asset_name,
          )

        let datum = intent_output.datum |> to_intent_datum()

        let datum_check =
          (datum.bounty_utxo == bounty_input.output_reference)? && (datum.contributor_address == contributor_address)?

        is_id_token_provided? && datum_check? && (only_mint_quantity == 1)?
      }
      AccpetRedeem -> {
        expect Some((_, _, bounty_mint_quantity)) =
          value_policy_info(mint, oracle_input_datum.bounty_token_policy_id)

        expect Some((_, _, intent_mint_quantity)) =
          value_policy_info(mint, oracle_input_datum.intent_token_policy_id)

        let is_burnt_check =
          (intent_mint_quantity == -1)? && (bounty_mint_quantity == -1)?
        is_burnt_check?
      }
      CancelRedeem -> {
        expect [(only_mint_policy_id, only_mint_asset_name, only_mint_quantity)] =
          value_tokens(mint)
        expect [intent_input] =
          inputs_at_with(
            inputs,
            oracle_input_datum.intent_token_store_address,
            only_mint_policy_id,
            only_mint_asset_name,
          )
        let intent_datum = intent_input.output.datum |> to_intent_datum()

        expect VerificationKey(contributor_pub_key_address) =
          intent_datum.contributor_address.payment_credential
        let sign_check =
          key_signed(extra_signatories, contributor_pub_key_address)

        sign_check? && (only_mint_quantity == -1)?
      }
    }
  }

  else(_) {
    fail
  }
}

type RedeemBountyTestCase {
  is_oracle_inputed: Bool,
  is_id_inputed: Bool,
  is_bounty_inputed: Bool,
  is_datum_check: Bool,
  is_intent_minted: Bool,
  is_intent_outputed: Bool,
}

const mock_oracle_datum: OracleDatum =
  OracleDatum {
    bounty_token_policy_id: mock_policy_id(0),
    bounty_board_address: from_script("bounty_board_hold"),
    id_token_policy_id: mock_policy_id(1),
    id_token_store_address: from_script("ref_token_hold"),
    intent_token_policy_id: mock_policy_id(2),
    intent_token_store_address: from_script("intent_token_hold"),
    owner: mock_pub_key_address(0, None),
  }

fn mock_mint_tx(test_case: RedeemBountyTestCase) -> Transaction {
  let RedeemBountyTestCase {
    is_oracle_inputed,
    is_id_inputed,
    is_bounty_inputed,
    is_datum_check,
    is_intent_minted,
    is_intent_outputed,
  } = test_case

  mocktail_tx()
    |> ref_tx_in(
        is_oracle_inputed,
        mock_tx_hash(0),
        0,
        from_asset(mock_policy_id(3), "oracle", 1),
        from_script("oracle_hold"),
      )
    |> ref_tx_in_inline_datum(is_oracle_inputed, mock_oracle_datum)
    |> tx_in(
        is_id_inputed,
        mock_tx_hash(0),
        0,
        merge(
          from_lovelace(100000000000),
          from_asset(mock_policy_id(1), cip68_222("token1"), 1),
        ),
        from_script("ref_token_hold"),
      )
    |> tx_in(
        is_bounty_inputed,
        mock_tx_hash(1),
        0,
        merge(
          from_lovelace(100000000000),
          from_asset(mock_policy_id(0), "token1", 1),
        ),
        from_script("bounty_board_hold"),
      )
    |> mint(is_intent_minted, 1, mock_policy_id(2), "token1")
    |> complete()
    |> add_output(
        is_intent_outputed,
        mock_script_output(
          from_script("intent_token_hold"),
          from_asset(mock_policy_id(2), "token1", 1),
          if is_datum_check {
            InlineDatum(
              IntentDatum {
                bounty_utxo: mock_utxo_ref(0, 0),
                contributor_address: mock_pub_key_address(1, None),
              },
            )
          } else {
            InlineDatum(mock_oracle_datum)
          },
        ),
      )
}

test success_mint_intent_token() {
  let intent_redeemer = RedeemBounty(mock_pub_key_address(1, None))

  let tx =
    mock_mint_tx(
      RedeemBountyTestCase {
        is_oracle_inputed: True,
        is_id_inputed: True,
        is_bounty_inputed: True,
        is_datum_check: True,
        is_intent_minted: True,
        is_intent_outputed: True,
      },
    )

  intent_token.mint(
    (mock_policy_id(3), "oracle"),
    intent_redeemer,
    mock_policy_id(2),
    tx,
  )
}

test fail_mint_identity_token_with_no_oracle() fail {
  let id_redeemer = IdRedeemr { action: CheckMint, token_name: "id" }

  let tx =
    mock_mint_tx(
      RedeemBountyTestCase {
        is_oracle_inputed: False,
        is_id_inputed: True,
        is_bounty_inputed: True,
        is_datum_check: True,
        is_intent_minted: True,
        is_intent_outputed: True,
      },
    )

  intent_token.mint(
    (mock_policy_id(3), "oracle"),
    intent_redeemer,
    mock_policy_id(2),
    tx,
  )
}

test fail_mint_identity_token_with_no_ref_output() fail {
  let id_redeemer = IdRedeemr { action: CheckMint, token_name: "id" }

  let tx =
    mock_mint_tx(
      MintTestCase {
        is_counter_inputed: True,
        is_oracle_inputed: True,
        is_ref_output_check: False,
        is_redeemer_check: True,
        is_datum_check: True,
        is_key_signed: True,
      },
    )

  identity_token.mint(
    (mock_policy_id(2), "oracle"),
    mock_policy_id(3),
    id_redeemer,
    mock_policy_id(1),
    tx,
  )
}

test fail_mint_identity_token_with_no_redeeme() fail {
  let id_redeemer = IdRedeemr { action: CheckMint, token_name: "id" }

  let tx =
    mock_mint_tx(
      MintTestCase {
        is_counter_inputed: True,
        is_oracle_inputed: True,
        is_ref_output_check: True,
        is_redeemer_check: False,
        is_datum_check: True,
        is_key_signed: True,
      },
    )

  identity_token.mint(
    (mock_policy_id(2), "oracle"),
    mock_policy_id(3),
    id_redeemer,
    mock_policy_id(1),
    tx,
  )
}

test fail_mint_identity_token_with_no_datumn() fail {
  let id_redeemer = IdRedeemr { action: CheckMint, token_name: "id" }

  let tx =
    mock_mint_tx(
      MintTestCase {
        is_counter_inputed: True,
        is_oracle_inputed: True,
        is_ref_output_check: True,
        is_redeemer_check: True,
        is_datum_check: False,
        is_key_signed: True,
      },
    )

  identity_token.mint(
    (mock_policy_id(2), "oracle"),
    mock_policy_id(3),
    id_redeemer,
    mock_policy_id(1),
    tx,
  )
}

test fail_mint_identity_token_with_no_sign() fail {
  let id_redeemer = IdRedeemr { action: CheckMint, token_name: "id" }

  let tx =
    mock_mint_tx(
      MintTestCase {
        is_counter_inputed: True,
        is_oracle_inputed: True,
        is_ref_output_check: True,
        is_redeemer_check: True,
        is_datum_check: True,
        is_key_signed: False,
      },
    )

  identity_token.mint(
    (mock_policy_id(2), "oracle"),
    mock_policy_id(3),
    id_redeemer,
    mock_policy_id(1),
    tx,
  )
}

type BurnTestCase {
  is_counter_inputed: Bool,
  is_oracle_inputed: Bool,
  is_redeemer_check: Bool,
  is_token_inputed: Bool,
}

fn mock_burn_tx(test_case: BurnTestCase) -> Transaction {
  let BurnTestCase {
    is_counter_inputed,
    is_oracle_inputed,
    is_redeemer_check,
    is_token_inputed,
  } = test_case

  mocktail_tx()
    |> mint(
        is_redeemer_check,
        -1,
        mock_policy_id(1),
        cip68_100("id")
          |> concat(convert_int_to_bytes(10)),
      )
    |> mint(
        is_redeemer_check,
        -1,
        mock_policy_id(1),
        cip68_222("id")
          |> concat(convert_int_to_bytes(10)),
      )
    |> tx_in(
        is_token_inputed,
        mock_tx_hash(1),
        0,
        from_asset(
          mock_policy_id(1),
          cip68_222("id")
            |> concat(convert_int_to_bytes(10)),
          1,
        ),
        mock_pub_key_address(0, None),
      )
    |> tx_in(
        is_token_inputed,
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
    |> ref_tx_in(
        is_oracle_inputed,
        mock_tx_hash(0),
        0,
        from_asset(mock_policy_id(2), "oracle", 1),
        from_script("ref_token_hold"),
      )
    |> ref_tx_in_inline_datum(is_oracle_inputed, mock_oracle_datum)
    |> tx_in(
        is_counter_inputed,
        mock_tx_hash(0),
        0,
        from_asset(mock_policy_id(3), "", 1),
        from_script("ref_token_hold"),
      )
    |> tx_in_inline_datum(
        is_counter_inputed,
        OracleCounterDatum { count: 10, owner: mock_pub_key_address(0, None) },
      )
    |> complete()
}

test success_burn_identity_token() {
  let id_redeemer = IdRedeemr { action: CheckBurn, token_name: "id" }

  let tx =
    mock_burn_tx(
      BurnTestCase {
        is_counter_inputed: True,
        is_oracle_inputed: True,
        is_redeemer_check: True,
        is_token_inputed: True,
      },
    )

  identity_token.mint(
    (mock_policy_id(2), "oracle"),
    mock_policy_id(3),
    id_redeemer,
    mock_policy_id(1),
    tx,
  )
}

test fail_burn_identity_token_with_no_redeemer() fail {
  let id_redeemer = IdRedeemr { action: CheckBurn, token_name: "id" }

  let tx =
    mock_burn_tx(
      BurnTestCase {
        is_counter_inputed: True,
        is_oracle_inputed: True,
        is_redeemer_check: False,
        is_token_inputed: True,
      },
    )

  identity_token.mint(
    (mock_policy_id(2), "oracle"),
    mock_policy_id(3),
    id_redeemer,
    mock_policy_id(1),
    tx,
  )
}
