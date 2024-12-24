use aiken/collection/dict
use aiken/collection/list
use bounty_token_type.{
  BountyDatum, BountyRedeemer, CheckBurn, CheckMint, to_bounty_datum,
}
use cardano/address.{from_script}
use cardano/assets.{AssetName, PolicyId, from_asset, quantity_of}
use cardano/transaction.{InlineDatum, Input, Transaction} as tx
use cip.{cip68_222}
use mocktail.{ add_output, complete, mint, mock_tx_hash, mocktail_tx, ref_tx_in,
  ref_tx_in_inline_datum, tx_in,
}
use mocktail/virgin_key_hash.{mock_policy_id, mock_pub_key_hash}
use mocktail/virgin_outputs.{mock_script_output}
use oracle_token_type.{OracleDatum}
use oracle_token_util.{get_oracle_nft_datum}

validator bounty_token(oracle_token: (PolicyId, AssetName)) {
  mint(redeemer: BountyRedeemer, policy_id: PolicyId, transaction: Transaction) {
    // destructure the transaction
    let Transaction { inputs, mint, outputs, reference_inputs, .. } =
      transaction

    //got the oracle nft 
    let oracle_input_datum: OracleDatum =
      reference_inputs |> get_oracle_nft_datum(oracle_token)

    let user_pkh = redeemer.pub_key_hash
    let id_token_asset_name = cip.cip68_222(redeemer.pub_key_hash)

    expect [Pair(asset_name, amount)] =
      mint
        |> assets.tokens(policy_id)
        |> dict.to_pairs()

    expect Some(bounty_nft_output) =
      outputs
        |> list.find(
            fn(output) {
              output.address == oracle_input_datum.bounty_board_address
            },
          )

    // user pkh
    // check identify token exceed
    expect Some(_id_nft_input) =
      inputs
        |> list.find(
            fn(input: Input) {
              (
                input.output.value
                  |> quantity_of(
                      oracle_input_datum.id_token_policy_id,
                      id_token_asset_name,
                    )
              ) > 0
            },
          )

    //check redeemer
    let redeemer_check =
      when redeemer.action is {
        CheckMint -> asset_name == user_pkh && amount == 1
        CheckBurn -> (amount == -1)?
      }
    let datum = bounty_nft_output.datum |> to_bounty_datum()
    let datum_check = (datum.github != @"")?

    and {
      redeemer_check?,
      datum_check?,
    }
  }

  else(_) {
    fail
  }
}

//test case

//I: successfully mint
test successful_mint_bounty_token() {
  let bounty_redeemer =
    BountyRedeemer { pub_key_hash: mock_pub_key_hash(0), action: CheckMint }
  let tx: Transaction =
    mocktail_tx()
      |> mint(True, 1, mock_policy_id(0), mock_pub_key_hash(0))
      |> tx_in(
          True,
          mock_tx_hash(0),
          0,
          from_asset(mock_policy_id(0), cip.cip68_222(mock_pub_key_hash(0)), 1),
          from_script("ref_token_hold"),
        )
      |> ref_tx_in(
          True,
          mock_tx_hash(0),
          0,
          from_asset(mock_policy_id(0), "oracle", 1),
          from_script("ref_token_hold"),
        )
      |> ref_tx_in_inline_datum(
          True,
          OracleDatum {
            bounty_token_policy_id: mock_policy_id(0),
            bounty_board_address: from_script("bounty_board_hold"),
            id_token_policy_id: mock_policy_id(0),
            id_token_store_address: from_script("ref_token_hold"),
          },
        )
      |> complete()
      |> add_output(
          True,
          mock_script_output(
            from_script("bounty_board_hold"),
            from_asset(mock_policy_id(0), "oracle", 1),
            InlineDatum(BountyDatum { github: @"abc", reward: 1 }),
          ),
        )

  let oracle_token: (PolicyId, AssetName) = (mock_policy_id(0), "oracle")

  bounty_token.mint(oracle_token, bounty_redeemer, mock_policy_id(0), tx)
}
//II: unsuccessful -> missing id_token
// test id_token_check()
// {

// }

//III: >=1 bounty token
// test mutiple_bounty_mint_check()
// {

// }
//IV: output address is not bounty board
// test output_check()
// {

// }
