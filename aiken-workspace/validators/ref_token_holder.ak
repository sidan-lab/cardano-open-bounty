// use aiken/collection/list
// use aiken/primitive/bytearray
// use cardano/assets.{flatten, without_lovelace}
// use cardano/transaction.{OutputReference, Transaction} as tx
// use cip.{cip68_100_prefix, cip68_222, cip68_222_prefix}

// validator modify_identity_token {
//   spend(_d, _r, own_ref: OutputReference, transaction: Transaction) {
//     let Transaction { inputs, .. } = transaction
//     expect Some(own_input) =
//       inputs |> list.find(fn(input) { input.output_reference == own_ref })
//     expect [(policy_id, ref_asset_name, amount)] =
//       own_input.output.value |> without_lovelace() |> flatten()
//     let name_check =
//       ref_asset_name |> bytearray.starts_with(prefix: cip.cip68_100_prefix)

//     // Get NFT AssetName
//     let pub_key_hash = ref_asset_name |> bytearray.drop(n: 4)
//     let nft_asset_name = cip68_222(pub_key_hash)

//     expect Some(nft) =
//       inputs
//         |> list.find(
//             fn(input) {
//               when
//                 input.output.value
//                   |> flatten()
//                   |> list.find(
//                       fn((policy, asset_name, _)) {
//                         asset_name == nft_asset_name && policy == policy_id
//                       },
//                     )
//               is {
//                 Some(_) -> True
//                 _ -> False
//               }
//             },
//           )
//     // set a direction to add or remove the minimum lovelace
//     // let that_value: Value =
//     //   assets.add(
//     //     this_input.output.value,
//     //     value.ada_policy_id,
//     //     value.ada_asset_name,
//     //     lovelace,
//     //   )
//     // This should prevent utxos without cip68 datum to go to the cip68 storage contract
//     // This Forces An Inline Datum!
//     expect _: CIP68 = find.output_datum_by_addr(tx.outputs, this_addr)
//     and {
//       name_check?,
//     }
//     //
//     //
//   }

//   else(_) {
//     fail
//   }
// }
