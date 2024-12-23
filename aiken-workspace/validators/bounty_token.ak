use aiken/cbor
use aiken/collection/dict
use aiken/collection/list
use aiken/primitive/bytearray
use cardano/address.{Address, from_script}
use cardano/assets.{PolicyId, flatten, from_asset}
use cardano/transaction.{InlineDatum, OutputReference, Transaction} as tx
use cip.{cip68_100, cip68_222}
use bounty_token_type.{
  CheckBurn, CheckMint, BountyDatum, BountyRedeemer, to_bounty_datum,
}
use mocktail.{add_output, complete, mint, mocktail_tx, required_signer_hash}
use mocktail/virgin_key_hash.{mock_policy_id, mock_pub_key_hash}
use mocktail/virgin_outputs.{mock_script_output}

use 

validator bounty_token() {
  mint(redeemer: BountyRedeemer, policy_id: PolicyId, transaction: Transaction) {
    let Transaction { inputs, mint,e outputs, .. } = transaction

    expect [Pair(asset_name, amount)] =
      mint
        |> assets.tokens(policy_id)
        |> dict.to_pairs()

    let id_tkn = cip.cip68_222(redeemer.pub_key_hash)

      token_value 
        |> flatten()
        |> list.find(
            fn((policy, asset_name, _)) {
              inputs == id_tkn && policy = policy_id
            },
          )
        |> list.drop( asset_name , 4 )

    expect Some(ref_output) =
      outputs
        |> list.find(fn(output) { output.address == bounty_board_address })


    let ref_output_check =
      when token_value
      is {
        Some(_) -> True
        _ -> False
      }

    let redeemer_check =
      when redeemer.action is {
        CheckMint ->
          token_value ==
        CheckBurn ->

      }

    let datum = ref_output.datum |> to_bounty_datum()
    let datum_check = (datum.github != @"")? && (datum.contributions == [])?

    and {
      ref_output_check?,
      redeemer_check?,
      datum_check?,
    }
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
      |> mint(
          True,
          1,
          mock_policy_id(0),
          bytearray.concat(#"000643b0", mock_pub_key_hash(0)),
        )
      |> mint(
          True,
          1,
          mock_policy_id(0),
          bytearray.concat(#"000de140", mock_pub_key_hash(0)),
        )
      |> required_signer_hash(True, mock_pub_key_hash(0))
      |> complete()
      |> add_output(
          True,
          mock_script_output(
            from_script("ref_token_hold"),
            from_asset(
              mock_policy_id(0),
              bytearray.concat(#"000643b0", mock_pub_key_hash(0)),
              1,
            ),
            InlineDatum(ContributerDatum { github: @"abc", contributions: [] }),
          ),
        )
  // InlineDatum(redeemer),
  let ref_token_hold_address: Address = from_script("ref_token_hold")
  identity_token.mint(ref_token_hold_address, redeemer, mock_policy_id(0), tx)
}

// test address_check() {
//   let ref_token_hold_address: Address = from_script("ref_token_hold")
//   cbor.serialise(ref_token_hold_address) == "d8799fd87a9f4e7265665f746f6b656e5f686f6c64ffd87a80ff"
// }

// test fail_mint_id_token() fail {
//   let redeemer =
//     MyRedeemer { pub_key_hash: mock_pub_key_hash(0), action: CheckMint }
//   let tx: Transaction =
//     mocktail_tx()
//       |> mint(True, 1, mock_policy_id(0), "") //     |> script_withdrawal(True, mock_script_hash(1), 0)
//       //     |> required_signer_hash(True, mock_pub_key_hash(1))
//       |> complete()
//   identity_token.mint(redeemer, mock_policy_id(0), tx)
// }

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
// test to_datum() {
//   let dummy_datum: Data = "abc"

//   cbor.serialise(to_my_datum(dummy_datum)) == cbor.serialise(
//     ContributerDatum { github: @"abc", contributions: [] },
//   )
// }

