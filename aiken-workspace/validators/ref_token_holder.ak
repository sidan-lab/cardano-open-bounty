use aiken/option
use aiken/transaction.{Input, ScriptContext, Spend, Transaction}
use aiken/transaction/credential.{Address}
use aiken/transaction/value.{Value}
use cip.{cip68_222}

validator modify_identity_token {
  spend(_d, _r, own_ref: OutputReference, transaction: Transaction) {
    let Transaction { inputs, .. } = transaction
    expect Some(own_input) =
      list.find(inputs, fn(input) { input.output_reference == own_ref })
    expect [Pair(_, ref_asset_name)] =
      flatten(without_lovelace(own_input.output.value))
    expect bytearray.starts_with(ref_asset_name, prefix: "100")

    let pub_key_hash = bytearray.drop(ref_asset_name, n: 3)
    let nft_asset_name = cip68_222(pub_key_hash)
    expect Some(nft) =
      list.find(
        inputs,
        fn(input) { flatten(input.output.value).2nd == nft_asset_name },
      )
    // set a direction to add or remove the minimum lovelace
    let that_value: Value =
      value.add(
        this_input.output.value,
        value.ada_policy_id,
        value.ada_asset_name,
        lovelace,
      )
    // This should prevent utxos without cip68 datum to go to the cip68 storage contract
    // This Forces An Inline Datum!
    expect _: CIP68 = find.output_datum_by_addr(tx.outputs, this_addr)
    //
    //
  }

  else(_) {
    fail
  }
}
