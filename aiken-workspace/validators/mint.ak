use aiken/collection/dict
use aiken/collection/list
use cardano/assets.{PolicyId}
use cardano/transaction.{OutputReference, Transaction} as tx

pub type Action {
  CheckMint
  CheckBurn
}

pub type MyRedeemer {
  pub_key_hash: ByteArray,
  action: Action,
}

validator identity_token {
  mint(redeemer: MyRedeemer, policy_id: PolicyId, transaction: Transaction) {
    let Transaction { inputs, mint, extra_signatories, .. } = transaction
    expect [Pair(asset_name, amount)] =
      mint
        |> assets.tokens(policy_id)
        |> dict.to_pairs()
    when redeemer.action is {
      CheckMint -> {
        expect extra_signatories |> list.has(redeemer.pub_key_hash)
        amount == 1
      }
      CheckBurn -> amount == -1
    }
  }

  else(_) {
    fail
  }
}
// {
//     constructor: 0,
//     fields: [
//         {
//             bytes: "pub_key_hash"
//         },
//         {
//             constructor: 0,
//             fields: []
//         }
//     ]
// }
