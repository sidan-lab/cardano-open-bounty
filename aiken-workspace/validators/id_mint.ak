use aiken/cbor
use aiken/collection/dict
use aiken/collection/list
use aiken/primitive/bytearray.{concat}
use cardano/address.{Address, from_script}
use cardano/assets.{AssetName, PolicyId, flatten, from_asset}
use cardano/transaction.{InlineDatum, Transaction} as tx
use cip.{cip68_100, cip68_222}
use cocktail/vodka_converter.{convert_int_to_bytes}
use identity_token_type.{
  CheckBurn, CheckMint, ContributerDatum, IdRedeemer, to_contributer_datum,
}
use mocktail.{
  add_output, complete, mint, mock_pub_key_address, mock_tx_hash, mocktail_tx,
  ref_tx_in, ref_tx_in_inline_datum, required_signer_hash,
}
use mocktail/virgin_key_hash.{mock_policy_id, mock_pub_key_hash}
use mocktail/virgin_outputs.{mock_script_output}
use oracle_token_type.{OracleCounterDatum, OracleDatum}
use oracle_token_util.{get_oracle_counter_datum, get_oracle_nft_datum}

validator identity_token(
  collection_name: ByteArray,
  oracle_nft: (PolicyId, AssetName),
  oracle_counter: PolicyId,
) {
  mint(redeemer: IdRedeemer, policy_id: PolicyId, transaction: Transaction) {
    let Transaction { mint, extra_signatories, outputs, reference_inputs, .. } =
      transaction

    expect oracle_input_datum: OracleDatum =
      reference_inputs |> get_oracle_nft_datum(oracle_nft)

    expect oracle_counter_datum: OracleCounterDatum =
      reference_inputs |> get_oracle_counter_datum(oracle_counter)

    expect [Pair(asset_name_1, amount_1),
      Pair(asset_name_2, amount_2)] =
      mint
        |> assets.tokens(policy_id)
        |> dict.to_pairs()
    let signer_check = extra_signatories |> list.has(redeemer.pub_key_hash)
    let ref_tkn =
      cip.cip68_100(collection_name)
        |> concat(convert_int_to_bytes(oracle_counter_datum.count))
    let nft_tkn =
      cip.cip68_222(collection_name)
        |> concat(convert_int_to_bytes(oracle_counter_datum.count))

    expect Some(ref_output) =
      outputs
        |> list.find(
            fn(output) {
              output.address == oracle_input_datum.id_token_store_address
            },
          )

    let ref_output_check =
      when
        ref_output.value
          |> flatten()
          |> list.find(
              fn((policy, asset_name, _)) {
                asset_name == ref_tkn && policy == policy_id
              },
            )
      is {
        Some(_) -> True
        _ -> False
      }

    let redeemer_check =
      when redeemer.action is {
        CheckMint ->
          if asset_name_1 == ref_tkn {
            asset_name_2 == nft_tkn
          } else if asset_name_1 == nft_tkn {
            asset_name_2 == ref_tkn
          } else {
            False
          }? && (amount_1 == 1)? && (amount_2 == 1)?
        CheckBurn -> (amount_1 == -1)? && (amount_2 == -1)?
      }

    let datum = ref_output.datum |> to_contributer_datum()
    let datum_check = (datum.github != @"")? && (datum.contributions == [])?

    and {
      signer_check?,
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
  let id_redeemer =
    IdRedeemer { pub_key_hash: mock_pub_key_hash(0), action: CheckMint }

  let collection_name = "id"

  let tx: Transaction =
    mocktail_tx()
      |> mint(
          True,
          1,
          mock_policy_id(1),
          bytearray.concat(#"000643b0", collection_name)
            |> concat(convert_int_to_bytes(10)),
        )
      |> mint(
          True,
          1,
          mock_policy_id(1),
          bytearray.concat(#"000de140", collection_name)
            |> concat(convert_int_to_bytes(10)),
        )
      |> required_signer_hash(True, mock_pub_key_hash(0))
      |> ref_tx_in(
          True,
          mock_tx_hash(0),
          0,
          from_asset(mock_policy_id(2), "oracle", 1),
          from_script("ref_token_hold"),
        )
      |> ref_tx_in_inline_datum(
          True,
          OracleDatum {
            bounty_token_policy_id: mock_policy_id(0),
            bounty_board_address: from_script("bounty_board_hold"),
            id_token_policy_id: mock_policy_id(1),
            id_token_store_address: from_script("ref_token_hold"),
            owner: mock_pub_key_address(0, None),
          },
        )
      |> ref_tx_in(
          True,
          mock_tx_hash(0),
          0,
          from_asset(mock_policy_id(3), "", 1),
          from_script("ref_token_hold"),
        )
      |> ref_tx_in_inline_datum(
          True,
          OracleCounterDatum { count: 10, owner: mock_pub_key_address(0, None) },
        )
      |> complete()
      |> add_output(
          True,
          mock_script_output(
            from_script("ref_token_hold"),
            from_asset(
              mock_policy_id(1),
              bytearray.concat(#"000643b0", collection_name)
                |> concat(convert_int_to_bytes(10)),
              1,
            ),
            InlineDatum(
              ContributerDatum { index: 0, github: @"abc", contributions: [] },
            ),
          ),
        )
  // InlineDatum(redeemer),
  identity_token.mint(
    collection_name,
    (mock_policy_id(2), "oracle"),
    mock_policy_id(3),
    id_redeemer,
    mock_policy_id(1),
    tx,
  )
}

test address_check() {
  let ref_token_hold_address: Address = from_script("ref_token_hold")
  cbor.serialise(ref_token_hold_address) != "d8799fd87a9f4e7265665f746f6b656e5f686f6c64ffd87a80ff"
}

test param_test() {
  let param: (PolicyId, AssetName) = ("abc", "")
  cbor.serialise(param) != ""
}

test fail_mint_identity_token() {
  let id_redeemer =
    IdRedeemer { pub_key_hash: mock_pub_key_hash(0), action: CheckMint }

  let collection_name = "id"

  let tx: Transaction =
    mocktail_tx()
      |> mint(
          True,
          1,
          mock_policy_id(1),
          bytearray.concat(#"000643b0", collection_name)
            |> concat(convert_int_to_bytes(10)),
        )
      |> mint(
          True,
          1,
          mock_policy_id(1),
          bytearray.concat(#"000de140", collection_name)
            |> concat(convert_int_to_bytes(10)),
        )
      |> required_signer_hash(True, mock_pub_key_hash(0))
      |> ref_tx_in(
          True,
          mock_tx_hash(0),
          0,
          from_asset(mock_policy_id(2), "oracle", 1),
          from_script("ref_token_hold"),
        )
      |> ref_tx_in_inline_datum(
          True,
          OracleDatum {
            bounty_token_policy_id: mock_policy_id(0),
            bounty_board_address: from_script("bounty_board_hold"),
            id_token_policy_id: mock_policy_id(1),
            id_token_store_address: from_script("ref_token_hold"),
            owner: mock_pub_key_address(0, None),
          },
        )
      |> ref_tx_in(
          True,
          mock_tx_hash(0),
          0,
          from_asset(mock_policy_id(4), "", 1),
          from_script("ref_token_hold"),
        )
      |> ref_tx_in_inline_datum(
          True,
          OracleCounterDatum { count: 10, owner: mock_pub_key_address(0, None) },
        )
      |> complete()
      |> add_output(
          True,
          mock_script_output(
            from_script("ref_token_hold"),
            from_asset(
              mock_policy_id(1),
              bytearray.concat(#"000643b0", collection_name)
                |> concat(convert_int_to_bytes(10)),
              1,
            ),
            InlineDatum(
              ContributerDatum { index: 0, github: @"abc", contributions: [] },
            ),
          ),
        )
  !identity_token.mint(
    collection_name,
    (mock_policy_id(2), "oracle"),
    mock_policy_id(3),
    id_redeemer,
    mock_policy_id(1),
    tx,
  )
}
