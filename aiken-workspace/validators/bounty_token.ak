use aiken/collection/dict
use aiken/collection/list
use aiken/primitive/bytearray.{starts_with}
use bounty_token_type.{
  BountyDatum, BountyRedeemer, CheckBurn, CheckMint, to_bounty_datum,
}
use bounty_token_util.{has_all_signers}
use cardano/address.{from_script}
use cardano/assets.{
  AssetName, PolicyId, flatten, from_asset, from_lovelace, lovelace_of, merge,
  without_lovelace,
}
use cardano/transaction.{InlineDatum, Input, Transaction} as tx
use cip.{cip68_100, cip68_100_prefix, cip68_222, cip68_222_prefix}
use identity_token_type.{ContributerDatum, Contribution, to_contributer_datum}
use mocktail.{
  MocktailTx, add_extra_signatory, add_output, complete, mint,
  mock_pub_key_address, mock_tx_hash, mocktail_tx, ref_tx_in,
  ref_tx_in_inline_datum, tx_in, tx_in_inline_datum,
}
use mocktail/virgin_key_hash.{mock_policy_id, mock_pub_key_hash}
use mocktail/virgin_outputs.{mock_script_output}
use oracle_token_type.{OracleDatum}
use oracle_token_util.{get_oracle_nft_datum}

validator bounty_token(oracle_token: (PolicyId, AssetName)) {
  mint(redeemer: BountyRedeemer, policy_id: PolicyId, transaction: Transaction) {
    // destructure the transaction
    let Transaction {
      inputs,
      mint,
      outputs,
      reference_inputs,
      extra_signatories,
      ..
    } = transaction

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
          expect [input0,
            input1] =
            inputs
              |> list.filter(
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

          // expect [(input0_policy_id, input0_asset_name, 1)] =
          //   input0.output.value |> without_lovelace() |> flatten()
          // expect [(input1_policy_id, input1_asset_name, 1)] =
          //   input1.output.value |> without_lovelace() |> flatten()
          // let input0_asset_name_raw = input0_asset_name |> bytearray.drop(4)
          // let input1_asset_name_raw = input1_asset_name |> bytearray.drop(4)
          // let prefix_check =
          //   if input0_asset_name |> starts_with(cip68_100_prefix) {
          //     input1_asset_name |> starts_with(cip68_222_prefix)
          //   } else if input0_asset_name |> starts_with(cip68_222_prefix) {
          //     input1_asset_name |> starts_with(cip68_100_prefix)
          //   } else {
          //     False
          //   }
          expect [id_ref_input] =
            [input0, input1]
              |> list.filter(
                  fn(input) {
                    expect [(policy, asset_name, 1)] =
                      input.output.value |> without_lovelace() |> flatten()
                    asset_name |> starts_with(cip68_100_prefix)
                  },
                )

          expect [_id_input] =
            [input0, input1]
              |> list.filter(
                  fn(input) {
                    expect [(policy, asset_name, 1)] =
                      input.output.value |> without_lovelace() |> flatten()

                    asset_name |> starts_with(cip68_222_prefix)
                  },
                )
          expect Some(bounty_input) =
            inputs
              |> list.find(
                  fn(input) {
                    expect [(policy, _, 1)] = input.output.value |> flatten()
                    policy == oracle_input_datum.bounty_token_policy_id
                  },
                )

          let input_contributer_datum: ContributerDatum =
            id_ref_input.output.datum |> to_contributer_datum()

          expect Some(id_ref_output) =
            outputs
              |> list.find(
                  fn(output) {
                    output.address == oracle_input_datum.id_token_store_address && output.value == id_ref_input.output.value
                  },
                )

          let updated_ref_token_datum: ContributerDatum =
            id_ref_output.datum |> to_contributer_datum()

          let bounty_datum: BountyDatum =
            bounty_input.output.datum |> to_bounty_datum()

          let update_check =
            updated_ref_token_datum == ContributerDatum {
              github: input_contributer_datum.github,
              contributions: input_contributer_datum.contributions
                |> list.push(
                    Contribution {
                      all_signatories: bounty_datum.all_signatories,
                      reward: bounty_datum.reward,
                    },
                  ),
            }

          let signatories_check =
            has_all_signers(bounty_datum.all_signatories, extra_signatories)

          and {
            amount == -1,
            signatories_check?,
            update_check?,
          }
        }
      }
    redeemer_check
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
          owner: mock_pub_key_address(0, None),
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
              all_signatories: [mock_pub_key_hash(0)],
            },
          ),
        ),
      )
}

fn successful_burn_tx() -> Transaction {
  mocktail_tx()
    |> mint(True, -1, mock_policy_id(0), "bounty")
    |> tx_in(
        True,
        mock_tx_hash(0),
        0,
        merge(
          from_lovelace(100000000000),
          from_asset(mock_policy_id(0), cip.cip68_100("id"), 1),
        ),
        from_script("ref_token_hold"),
      )
    |> tx_in_inline_datum(
        True,
        ContributerDatum { github: @"abc", contributions: [] },
      )
    |> tx_in(
        True,
        mock_tx_hash(0),
        0,
        merge(
          from_lovelace(100000000000),
          from_asset(mock_policy_id(0), cip.cip68_222("id"), 1),
        ),
        from_script("ref_token_hold"),
      )
    |> tx_in(
        True,
        mock_tx_hash(0),
        0,
        from_asset(mock_policy_id(1), "bounty", 1),
        from_script("bounty_board_hold"),
      )
    |> tx_in_inline_datum(
        True,
        BountyDatum {
          issue_url: [],
          reward: 100000000000,
          all_signatories: [mock_pub_key_hash(0), mock_pub_key_hash(1)],
        },
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
          bounty_token_policy_id: mock_policy_id(1),
          bounty_board_address: from_script("bounty_board_hold"),
          id_token_policy_id: mock_policy_id(0),
          id_token_store_address: from_script("ref_token_hold"),
          owner: mock_pub_key_address(0, None),
        },
      )
    |> complete()
    |> add_extra_signatory(True, mock_pub_key_hash(0))
    |> add_extra_signatory(True, mock_pub_key_hash(1))
    |> add_output(
        True,
        mock_script_output(
          from_script("ref_token_hold"),
          merge(
            from_lovelace(100000000000),
            from_asset(mock_policy_id(0), cip.cip68_100("id"), 1),
          ),
          InlineDatum(
            ContributerDatum {
              github: @"abc",
              contributions: [
                Contribution {
                  all_signatories: [mock_pub_key_hash(0), mock_pub_key_hash(1)],
                  reward: 100000000000,
                },
              ],
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
                all_signatories: [mock_pub_key_hash(0)],
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
                all_signatories: [mock_pub_key_hash(0)],
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
                all_signatories: [mock_pub_key_hash(0)],
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
                all_signatories: [mock_pub_key_hash(0)],
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

test successful_burn_bounty_token() {
  let bounty_redeemer = BountyRedeemer { action: CheckBurn }

  let tx: Transaction = successful_burn_tx()

  bounty_token.mint(
    (mock_policy_id(0), "oracle"),
    bounty_redeemer,
    mock_policy_id(0),
    tx,
  )
}

test missing_ref_token_burn_check() fail {
  let bounty_redeemer = BountyRedeemer { action: CheckBurn }

  let tx: Transaction =
    MocktailTx {
      tx: Transaction { ..successful_burn_tx(), inputs: [] },
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
      |> tx_in_inline_datum(
          True,
          ContributerDatum { github: @"abc", contributions: [] },
        )
      |> complete()

  bounty_token.mint(
    (mock_policy_id(0), "oracle"),
    bounty_redeemer,
    mock_policy_id(0),
    tx,
  )
}

test missing_id_token_burn_check() fail {
  let bounty_redeemer = BountyRedeemer { action: CheckBurn }

  let tx: Transaction =
    MocktailTx {
      tx: Transaction { ..successful_burn_tx(), inputs: [] },
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

test missing_bounty_token_burn_check() fail {
  let bounty_redeemer = BountyRedeemer { action: CheckBurn }

  let tx: Transaction =
    MocktailTx {
      tx: Transaction { ..successful_burn_tx(), inputs: [] },
      queue_input: None,
      queue_output: None,
      queue_ref_input: None,
    }
      |> tx_in(
          True,
          mock_tx_hash(0),
          0,
          from_lovelace(1010),
          from_script("bounty_board_hold"),
        )
      |> complete()

  bounty_token.mint(
    (mock_policy_id(0), "oracle"),
    bounty_redeemer,
    mock_policy_id(0),
    tx,
  )
}

test invalid_id_token_burn_check() fail {
  let bounty_redeemer = BountyRedeemer { action: CheckBurn }

  let tx: Transaction =
    MocktailTx {
      tx: Transaction { ..successful_burn_tx(), inputs: [] },
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
            from_asset(mock_policy_id(0), cip.cip68_100("worng_id"), 1),
          ),
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

test invalid_ref_token_burn_check() fail {
  let bounty_redeemer = BountyRedeemer { action: CheckBurn }

  let tx: Transaction =
    MocktailTx {
      tx: Transaction { ..successful_burn_tx(), inputs: [] },
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
            from_asset(mock_policy_id(0), cip.cip68_222("worng_id"), 1),
          ),
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

test invalid_bounty_token_burn_check() fail {
  let bounty_redeemer = BountyRedeemer { action: CheckBurn }

  let tx: Transaction =
    MocktailTx {
      tx: Transaction { ..successful_burn_tx(), inputs: [] },
      queue_input: None,
      queue_output: None,
      queue_ref_input: None,
    }
      |> tx_in(
          True,
          mock_tx_hash(0),
          0,
          from_asset(mock_policy_id(0), "Wrong_bounty", 1),
          from_script("bounty_board_hold"),
        )
      |> complete()

  bounty_token.mint(
    (mock_policy_id(0), "oracle"),
    bounty_redeemer,
    mock_policy_id(0),
    tx,
  )
}

test invalid_signatory_check() fail {
  let bounty_redeemer = BountyRedeemer { action: CheckBurn }

  let tx: Transaction =
    MocktailTx {
      tx: Transaction { ..successful_burn_tx(), outputs: [] },
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
              from_asset(mock_policy_id(0), cip.cip68_100("id"), 1),
            ),
            InlineDatum(
              ContributerDatum {
                github: @"abc",
                contributions: [
                  Contribution {
                    all_signatories: [
                      mock_pub_key_hash(2),
                      mock_pub_key_hash(3),
                    ],
                    reward: 100000000000,
                  },
                ],
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

test missing_signatories() fail {
  let bounty_redeemer = BountyRedeemer { action: CheckBurn }

  let tx: Transaction =
    MocktailTx {
      tx: Transaction { ..successful_burn_tx(), outputs: [] },
      queue_input: None,
      queue_output: None,
      queue_ref_input: None,
    }
      |> tx_in(
          True,
          mock_tx_hash(0),
          0,
          from_asset(mock_policy_id(1), "bounty", 1),
          from_script("bounty_board_hold"),
        )
      |> tx_in_inline_datum(
          True,
          BountyDatum {
            issue_url: [],
            reward: 100000000000,
            all_signatories: [
              mock_pub_key_hash(0),
              mock_pub_key_hash(1),
              mock_pub_key_hash(2),
              mock_pub_key_hash(3),
            ],
          },
        )
      |> complete()

  bounty_token.mint(
    (mock_policy_id(0), "oracle"),
    bounty_redeemer,
    mock_policy_id(0),
    tx,
  )
}

test invalid_index() fail {
  let bounty_redeemer = BountyRedeemer { action: CheckBurn }

  let tx: Transaction =
    MocktailTx {
      tx: Transaction { ..successful_burn_tx(), outputs: [] },
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
              from_asset(mock_policy_id(0), cip.cip68_100("id"), 1),
            ),
            InlineDatum(
              ContributerDatum {
                github: @"abc",
                contributions: [
                  Contribution {
                    all_signatories: [
                      mock_pub_key_hash(0),
                      mock_pub_key_hash(1),
                    ],
                    reward: 100000000000,
                  },
                ],
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

test invalid_github() fail {
  let bounty_redeemer = BountyRedeemer { action: CheckBurn }

  let tx: Transaction =
    MocktailTx {
      tx: Transaction { ..successful_burn_tx(), outputs: [] },
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
              from_asset(mock_policy_id(0), cip.cip68_100("id"), 1),
            ),
            InlineDatum(
              ContributerDatum {
                github: @"wrong_abc",
                contributions: [
                  Contribution {
                    all_signatories: [
                      mock_pub_key_hash(0),
                      mock_pub_key_hash(1),
                    ],
                    reward: 100000000000,
                  },
                ],
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

test missing_updated_reward() fail {
  let bounty_redeemer = BountyRedeemer { action: CheckBurn }

  let tx: Transaction =
    MocktailTx {
      tx: Transaction { ..successful_burn_tx(), outputs: [] },
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
              from_asset(mock_policy_id(0), cip.cip68_100("id"), 1),
            ),
            InlineDatum(
              ContributerDatum {
                github: @"abc",
                contributions: [
                  Contribution {
                    all_signatories: [
                      mock_pub_key_hash(0),
                      mock_pub_key_hash(1),
                    ],
                    reward: 102141,
                  },
                ],
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
