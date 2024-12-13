use aiken/cbor
use aiken/collection/dict
use aiken/collection/list
use cardano/assets.{PolicyId}
use cardano/transaction.{OutputReference, Transaction, placeholder} as tx
use mocktail.{complete, mint, mocktail_tx, required_signer_hash}
use mocktail/virgin_key_hash.{mock_policy_id, mock_pub_key_hash}

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
    let Transaction { mint, extra_signatories, .. } = transaction

    when
      mint
        |> assets.tokens(policy_id)
        |> dict.to_pairs()
    is {
      [Pair(asset_name, amount)] ->
        when redeemer.action is {
          CheckMint -> {
            let signer_check =
              extra_signatories |> list.has(redeemer.pub_key_hash)
            signer_check? && (amount == 1)?
          }
          CheckBurn -> amount == -1
        }
      _ -> False
    }
    // expect [Pair(asset_name, amount)] =
    //   mint
    //     |> assets.tokens(policy_id)
    //     |> dict.to_pairs()
    // when redeemer.action is {
    //   CheckMint -> {
    //     expect extra_signatories |> list.has(redeemer.pub_key_hash)
    //     amount == 1
    //   }
    //   CheckBurn -> amount == -1
    // }
  }

  else(_) {
    fail
  }
}

test success_mint_identity_token() {
  let redeemer =
    MyRedeemer { pub_key_hash: mock_pub_key_hash(0), action: CheckMint }
  let tx: Transaction =
    mocktail_tx()
      |> mint(True, 1, mock_policy_id(0), "")
      |> required_signer_hash(True, mock_pub_key_hash(0)) //     |> script_withdrawal(True, mock_script_hash(0), 0)
      //     |> script_withdrawal(True, mock_script_hash(1), 0)
      //     |> required_signer_hash(True, mock_pub_key_hash(1))
      |> complete()
  identity_token.mint(redeemer, mock_policy_id(0), tx)
}

test fail_mint_id_token() fail {
  let redeemer =
    MyRedeemer { pub_key_hash: mock_pub_key_hash(0), action: CheckMint }
  let tx: Transaction =
    mocktail_tx()
      |> mint(True, 1, mock_policy_id(0), "") //     |> script_withdrawal(True, mock_script_hash(1), 0)
      //     |> required_signer_hash(True, mock_pub_key_hash(1))
      |> complete()
  identity_token.mint(redeemer, mock_policy_id(0), tx)
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

test redeemer_hex() {
  let redeemer =
    MyRedeemer { pub_key_hash: mock_pub_key_hash(0), action: CheckMint }
  cbor.serialise(redeemer) == #"d8799f581c1b25744c74cf166de9feee1ae6f8cc8b7281a12e6f4d503bb2ecc67cd87980ff"
}
