use aiken/collection/dict
use aiken/collection/list
use cardano/assets.{PolicyId, add, from_asset, zero}
use cardano/transaction.{Input, OutputReference, Transaction, placeholder}
use mocktail.{
  complete, mint, mock_policy_id, mock_pub_key_address, mock_tx_hash,
  mock_utxo_ref, mocktail_tx, tx_in,
}
use oracle_token_type.{Action, CheckBurn, CheckMint}

validator one_shot(utxo_ref: OutputReference) {
  mint(redeemer: Action, policy_id: PolicyId, self: Transaction) {
    // It checks that only one minted asset exists and will fail otherwise
    expect [Pair(_asset_name, quantity)] =
      self.mint
        |> assets.tokens(policy_id)
        |> dict.to_pairs()
    let Transaction { inputs, .. } = self
    // Check if the specified UTxO reference (utxo_ref) is consumed by any input
    let is_output_consumed =
      list.any(inputs, fn(input) { input.output_reference == utxo_ref })
    when redeemer is {
      CheckMint -> is_output_consumed? && quantity == 1
      CheckBurn -> quantity == -1
    }
    // No need to check if output is consumed for burning
  }

  else(_) {
    fail
  }
}

test success_mint() {
  let redeemer = CheckMint
  let input_utxo = mock_utxo_ref(0, 1)
  let policy_id = mock_policy_id(0)

  let tx =
    mocktail_tx()
      |> mint(True, 1, policy_id, "")
      |> tx_in(True, mock_tx_hash(0), 1, zero, mock_pub_key_address(0, None))
      |> complete()

  one_shot.mint(input_utxo, redeemer, policy_id, tx)
}

test fail_mint_no_utxo_ref_supply() fail {
  let redeemer = CheckMint
  let policy_id = mock_policy_id(0)

  !one_shot.mint(mock_utxo_ref(0, 0), redeemer, policy_id, placeholder)
}

test success_burn() {
  let redeemer = CheckBurn
  let policy_id = mock_policy_id(0)

  let tx = Transaction { ..placeholder, mint: from_asset(policy_id, "", -1) }
  one_shot.mint(mock_utxo_ref(0, 0), redeemer, policy_id, tx)
}

test success_burn_with_other_minting() {
  let redeemer = CheckBurn
  let policy_id = mock_policy_id(0)

  let tx =
    Transaction {
      ..placeholder,
      mint: from_asset(policy_id, "", -1) |> add(mock_policy_id(1), "", 1),
    }
  one_shot.mint(mock_utxo_ref(0, 0), redeemer, policy_id, tx)
}

test fail_burn_with_mint() {
  let redeemer = CheckBurn
  let policy_id = mock_policy_id(0)

  let tx = Transaction { ..placeholder, mint: from_asset(policy_id, "", 1) }
  !one_shot.mint(mock_utxo_ref(0, 0), redeemer, policy_id, tx)
}
