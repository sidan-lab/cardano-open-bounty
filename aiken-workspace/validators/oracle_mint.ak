use aiken/cbor
use aiken/collection/dict
use aiken/collection/list
use cardano/assets.{PolicyId}
use cardano/transaction.{OutputReference, Transaction}
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
      CheckMint -> is_output_consumed? && (quantity == 1)?
      CheckBurn -> (quantity == -1)?
    }
    // No need to check if output is consumed for burning
  }

  else(_) {
    fail
  }
}

test redeemer_hex() {
  let redeemer = CheckMint
  cbor.serialise(redeemer) != #"d8799f581c1b25744c74cf166de9feee1ae6f8cc8b7281a12e6f4d503bb2ecc67cd87980ff"
}
