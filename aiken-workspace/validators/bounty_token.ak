use aiken/collection/dict
use aiken/collection/list
use bounty_token_type.{
  BountyDatum, BountyRedeemer, CheckBurn, CheckMint, to_bounty_datum,
}
use cardano/address.{from_script}
use cardano/assets.{
  AssetName, PolicyId, flatten, from_asset, from_lovelace, lovelace_of, merge,
}
use cardano/transaction.{InlineDatum, Input, Transaction} as tx
use mocktail.{
  MocktailTx, add_output, complete, mint, mock_tx_hash, mocktail_tx, ref_tx_in,
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

    expect [Pair(asset_name, amount)] =
      mint
        |> assets.tokens(policy_id)
        |> dict.to_pairs()

    let oracle_input_datum: OracleDatum =
      reference_inputs |> get_oracle_nft_datum(oracle_token)
    //check redeemer
    let redeemer_check =
      when redeemer.action is {
        CheckMint -> {
          //got the oracle nft 

          expect Some(_bounty_nft_output) =
            outputs
              |> list.find(
                  fn(output) {
                    let address_check =
                      (output.address == oracle_input_datum.bounty_board_address)?

                    let datum = output.datum |> to_bounty_datum()
                    let datum_check =
                      (lovelace_of(output.value) >= datum.reward)?

                    address_check && datum_check
                  },
                )

          // expect id token policy id == bounty token policy id
          expect Some(_id_nft) =
            inputs
              |> list.find(
                  fn(input) {
                    when
                      input.output.value
                        |> flatten()
                        |> list.find(
                            fn((policy, _, _)) {
                              policy == oracle_input_datum.id_token_policy_id
                            },
                          )
                    is {
                      Some(_) -> True
                      _ -> False
                    }
                  },
                )
          amount == 1
        }
        CheckBurn -> {
          expect Some(_id_nft) =
            inputs
              |> list.find(
                  fn(input) {
                    when
                      input.output.value
                        |> flatten()
                        |> list.find(
                            fn((policy, _, _)) {
                              policy == oracle_input_datum.id_token_policy_id
                            },
                          )
                    is {
                      Some(_) -> True
                      _ -> False
                    }
                  },
                )

          amount == -1
        }
      }

    redeemer_check?
  }

  else(_) {
    fail
  }
}

//test case

//I: successfully mint
fn successful_mint_tx() -> Transaction {
  mocktail_tx()
    |> mint(True, 1, mock_policy_id(0), "token1")
    |> tx_in(
        True,
        mock_tx_hash(0),
        0,
        merge(
          from_lovelace(100000000000),
          from_asset(mock_policy_id(0), "abc", 1),
        ),
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
          merge(
            from_lovelace(100000000000),
            from_asset(mock_policy_id(0), "abc", 1),
          ),
          InlineDatum(
            BountyDatum {
              issue_url: [],
              reward: 100000000000,
              extra_signatories: [mock_pub_key_hash(0)],
            },
          ),
        ),
      )
}

test successful_mint_bounty_token() {
  let bounty_redeemer = BountyRedeemer { action: CheckMint }

  let tx: Transaction = successful_mint_tx()
  bounty_token.mint(
    (mock_policy_id(0), "oracle"),
    bounty_redeemer,
    mock_policy_id(0),
    tx,
  )
}

test missing_id_token_check() fail {
  let bounty_redeemer = BountyRedeemer { action: CheckMint }
  let tx: Transaction =
    MocktailTx {
      tx: Transaction { ..successful_mint_tx(), inputs: [] },
      queue_input: None,
      queue_output: None,
      queue_ref_input: None,
    }
      |> tx_in(
          True,
          mock_tx_hash(0),
          0,
          from_lovelace(100000000000),
          from_script("ref_token_hold"),
        )
      |> complete()

  bounty_token.mint(
    (mock_policy_id(0), "oracle"),
    bounty_redeemer,
    mock_policy_id(0),
    tx,
  )
}

test invalid_id_tkn() fail {
  let bounty_redeemer = BountyRedeemer { action: CheckMint }
  let tx: Transaction =
    MocktailTx {
      tx: Transaction { ..successful_mint_tx(), inputs: [], outputs: [] },
      queue_input: None,
      queue_output: None,
      queue_ref_input: None,
    }
      |> tx_in(
          True,
          mock_tx_hash(0),
          0,
          merge(
            from_lovelace(100000000000),
            from_asset(mock_policy_id(1), "bcd", 1),
          ),
          from_script("ref_token_hold"),
        )
      |> complete()
      |> add_output(
          True,
          mock_script_output(
            from_script("bounty_board_hold"),
            merge(
              from_lovelace(100000000000),
              from_asset(mock_policy_id(1), "bcd", 1),
            ),
            InlineDatum(
              BountyDatum {
                issue_url: [],
                reward: 100000000000,
                extra_signatories: [mock_pub_key_hash(0)],
              },
            ),
          ),
        )

  bounty_token.mint(
    (mock_policy_id(0), "oracle"),
    bounty_redeemer,
    mock_policy_id(0),
    tx,
  )
}

test no_lovelace() fail {
  let bounty_redeemer = BountyRedeemer { action: CheckMint }
  let tx: Transaction =
    MocktailTx {
      tx: Transaction { ..successful_mint_tx(), inputs: [], outputs: [] },
      queue_input: None,
      queue_output: None,
      queue_ref_input: None,
    }
      |> tx_in(
          True,
          mock_tx_hash(0),
          0,
          from_asset(mock_policy_id(0), "abc", 1),
          from_script("ref_token_hold"),
        )
      |> complete()
      |> add_output(
          True,
          mock_script_output(
            from_script("bounty_board_hold"),
            from_asset(mock_policy_id(0), "abc", 1),
            InlineDatum(
              BountyDatum {
                issue_url: [],
                reward: 100000000000,
                extra_signatories: [mock_pub_key_hash(0)],
              },
            ),
          ),
        )
  bounty_token.mint(
    (mock_policy_id(0), "oracle"),
    bounty_redeemer,
    mock_policy_id(0),
    tx,
  )
}

test lesser_lovelace() fail {
  let bounty_redeemer = BountyRedeemer { action: CheckMint }
  let tx: Transaction =
    MocktailTx {
      tx: Transaction { ..successful_mint_tx(), inputs: [], outputs: [] },
      queue_input: None,
      queue_output: None,
      queue_ref_input: None,
    }
      |> tx_in(
          True,
          mock_tx_hash(0),
          0,
          merge(from_lovelace(100000), from_asset(mock_policy_id(0), "abc", 1)),
          from_script("ref_token_hold"),
        )
      |> complete()
      |> add_output(
          True,
          mock_script_output(
            from_script("bounty_board_hold"),
            merge(
              from_lovelace(100000),
              from_asset(mock_policy_id(0), "abc", 1),
            ),
            InlineDatum(
              BountyDatum {
                issue_url: [],
                reward: 100000000000,
                extra_signatories: [mock_pub_key_hash(0)],
              },
            ),
          ),
        )
  bounty_token.mint(
    (mock_policy_id(0), "oracle"),
    bounty_redeemer,
    mock_policy_id(0),
    tx,
  )
}

test invalid_address() fail {
  let bounty_redeemer = BountyRedeemer { action: CheckMint }
  let tx: Transaction =
    MocktailTx {
      tx: Transaction { ..successful_mint_tx(), outputs: [] },
      queue_input: None,
      queue_output: None,
      queue_ref_input: None,
    }
      |> complete()
      |> add_output(
          True,
          mock_script_output(
            from_script("ref_token_hold"),
            merge(
              from_lovelace(100000000000),
              from_asset(mock_policy_id(0), "abc", 1),
            ),
            InlineDatum(
              BountyDatum {
                issue_url: [],
                reward: 100000000000,
                extra_signatories: [mock_pub_key_hash(0)],
              },
            ),
          ),
        )
  bounty_token.mint(
    (mock_policy_id(0), "oracle"),
    bounty_redeemer,
    mock_policy_id(0),
    tx,
  )
}
