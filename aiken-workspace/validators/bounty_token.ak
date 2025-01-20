use bounty_token_type.{
  Action, BountyDatum, CheckBurn, CheckMint, to_bounty_datum,
}
use cardano/address.{from_script}
use cardano/assets.{
  AssetName, PolicyId, add, from_asset, from_lovelace, lovelace_of, merge,
}
use cardano/transaction.{InlineDatum, Input, Transaction} as tx
use cip.{cip68_100, cip68_222}
use cocktail.{inputs_at_with, key_signed, outputs_at_with, value_tokens}
use identity_token_type.{ContributerDatum, to_contributer_datum}
use identity_token_util.{is_token_provided, update_contributor_datum}
use mocktail.{
  MocktailTx, add_extra_signatory, add_output, complete, mint, mock_policy_id,
  mock_pub_key_address, mock_pub_key_hash, mock_script_output, mock_tx_hash,
  mocktail_tx, ref_tx_in, ref_tx_in_inline_datum, tx_in, tx_in_inline_datum,
  tx_out, tx_out_inline_datum,
}
use oracle_token_type.{OracleDatum}
use oracle_token_util.{get_oracle_nft_datum}

validator bounty_token(oracle_token: (PolicyId, AssetName)) {
  mint(redeemer: Action, policy_id: PolicyId, transaction: Transaction) {
    // destructure the transaction
    let Transaction {
      inputs,
      mint,
      outputs,
      reference_inputs,
      extra_signatories,
      ..
    } = transaction

    expect [(_, only_mint_asset_name, only_mint_quantity)] = value_tokens(mint)

    let OracleDatum {
      bounty_token_policy_id,
      bounty_board_address,
      id_token_policy_id,
      id_token_store_address,
      ..
    }: OracleDatum = reference_inputs |> get_oracle_nft_datum(oracle_token)

    //check redeemer
    when redeemer is {
      CheckMint -> {
        expect [bounty_nft_output] =
          outputs_at_with(
            outputs,
            bounty_board_address,
            policy_id,
            only_mint_asset_name,
          )

        let datum = bounty_nft_output.datum |> to_bounty_datum()
        let is_bounty_reward_provided =
          (lovelace_of(bounty_nft_output.value) >= datum.reward)?

        let is_id_token_provided =
          is_token_provided(
            inputs,
            id_token_policy_id,
            cip68_222(only_mint_asset_name),
          )

        is_bounty_reward_provided? && is_id_token_provided?
      }
      CheckBurn(contributer_asset_name) -> {
        expect [owner_id_ref_input] =
          inputs_at_with(
            reference_inputs,
            id_token_store_address,
            id_token_policy_id,
            cip68_100(only_mint_asset_name),
          )
        expect [contributor_id_ref_input] =
          inputs_at_with(
            inputs,
            id_token_store_address,
            id_token_policy_id,
            cip68_100(contributer_asset_name),
          )
        expect [contributor_id_ref_output] =
          outputs_at_with(
            outputs,
            id_token_store_address,
            id_token_policy_id,
            cip68_100(contributer_asset_name),
          )
        expect [bounty_input] =
          inputs_at_with(
            inputs,
            bounty_board_address,
            bounty_token_policy_id,
            only_mint_asset_name,
          )

        let owner_id_datum: ContributerDatum =
          owner_id_ref_input.output.datum |> to_contributer_datum()

        let input_contributer_datum: ContributerDatum =
          contributor_id_ref_input.output.datum |> to_contributer_datum()

        let updated_ref_token_datum: ContributerDatum =
          contributor_id_ref_output.datum |> to_contributer_datum()

        let bounty_datum: BountyDatum =
          bounty_input.output.datum |> to_bounty_datum()

        let is_owner_signed =
          key_signed(extra_signatories, owner_id_datum.pub_key_hash)

        let update_check =
          updated_ref_token_datum == update_contributor_datum(
            input_contributer_datum,
            only_mint_asset_name,
            bounty_datum.reward,
          )

        and {
          is_owner_signed?,
          only_mint_quantity == -1,
          update_check?,
        }
      }
    }
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
            from_asset(mock_policy_id(0), "", 1),
          ),
          InlineDatum(BountyDatum { issue_url: [], reward: 100000000000 }),
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
        ContributerDatum {
          metadata: [],
          version: 1,
          contributions: [],
          pub_key_hash: mock_pub_key_hash(0),
        },
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
        BountyDatum { issue_url: [], reward: 100000000000 },
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
              metadata: [],
              version: 1,
              contributions: [Pair(mock_pub_key_hash(0), 100000000000)],
              pub_key_hash: mock_pub_key_hash(0),
            },
          ),
        ),
      )
}

test successful_mint_bounty_token() {
  let bounty_redeemer = CheckMint

  let tx: Transaction = successful_mint_tx()
  bounty_token.mint(
    (mock_policy_id(0), "oracle"),
    bounty_redeemer,
    mock_policy_id(0),
    tx,
  )
}

test missing_id_token_check() fail {
  let bounty_redeemer = CheckMint
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
  let bounty_redeemer = CheckMint
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
            InlineDatum(BountyDatum { issue_url: [], reward: 100000000000 }),
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
  let bounty_redeemer = CheckMint
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
            InlineDatum(BountyDatum { issue_url: [], reward: 100000000000 }),
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
  let bounty_redeemer = CheckMint
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
            InlineDatum(BountyDatum { issue_url: [], reward: 100000000000 }),
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
  let bounty_redeemer = CheckMint
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
            InlineDatum(BountyDatum { issue_url: [], reward: 100000000000 }),
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
  let bounty_redeemer = CheckBurn

  let tx: Transaction = successful_burn_tx()

  bounty_token.mint(
    (mock_policy_id(0), "oracle"),
    bounty_redeemer("contributor"),
    mock_policy_id(0),
    tx,
  )
}

test missing_ref_token_burn_check() fail {
  let bounty_redeemer = CheckBurn

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
          ContributerDatum {
            metadata: [],
            version: 1,
            contributions: [],
            pub_key_hash: mock_pub_key_hash(0),
          },
        )
      |> complete()

  bounty_token.mint(
    (mock_policy_id(0), "oracle"),
    bounty_redeemer("contributor"),
    mock_policy_id(0),
    tx,
  )
}

test missing_id_token_burn_check() fail {
  let bounty_redeemer = CheckBurn

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
    bounty_redeemer("contributor"),
    mock_policy_id(0),
    tx,
  )
}

test missing_bounty_token_burn_check() fail {
  let bounty_redeemer = CheckBurn

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
    bounty_redeemer("contributor"),
    mock_policy_id(0),
    tx,
  )
}

test invalid_id_token_burn_check() fail {
  let bounty_redeemer = CheckBurn

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
    bounty_redeemer("contributor"),
    mock_policy_id(0),
    tx,
  )
}

test invalid_ref_token_burn_check() fail {
  let bounty_redeemer = CheckBurn

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
    bounty_redeemer("contributor"),
    mock_policy_id(0),
    tx,
  )
}

test invalid_bounty_token_burn_check() fail {
  let bounty_redeemer = CheckBurn

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
    bounty_redeemer("contributor"),
    mock_policy_id(0),
    tx,
  )
}

test invalid_signatory_check() fail {
  let bounty_redeemer = CheckBurn

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
                metadata: [],
                version: 1,
                contributions: [Pair(mock_pub_key_hash(2), 100000000000)],
                pub_key_hash: mock_pub_key_hash(0),
              },
            ),
          ),
        )

  bounty_token.mint(
    (mock_policy_id(0), "oracle"),
    bounty_redeemer("contributor"),
    mock_policy_id(0),
    tx,
  )
}

test missing_signatories() fail {
  let bounty_redeemer = CheckBurn

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
          BountyDatum { issue_url: [], reward: 100000000000 },
        )
      |> complete()

  bounty_token.mint(
    (mock_policy_id(0), "oracle"),
    bounty_redeemer("contributor"),
    mock_policy_id(0),
    tx,
  )
}

test invalid_github() fail {
  let bounty_redeemer = CheckBurn

  let tx: Transaction =
    MocktailTx {
      tx: Transaction { ..successful_burn_tx(), outputs: [] },
      queue_input: None,
      queue_output: None,
      queue_ref_input: None,
    }
      |> tx_out(
          True,
          from_script("ref_token_hold"),
          from_lovelace(100000000000)
            |> add(mock_policy_id(0), cip.cip68_100("id"), 1),
        )
      |> tx_out_inline_datum(
          True,
          ContributerDatum {
            metadata: [],
            version: 1,
            contributions: [Pair(mock_pub_key_hash(0), 100000000000)],
            pub_key_hash: mock_pub_key_hash(0),
          },
        )
      |> complete()

  bounty_token.mint(
    (mock_policy_id(0), "oracle"),
    bounty_redeemer("contributor"),
    mock_policy_id(0),
    tx,
  )
}

test missing_updated_reward() fail {
  let bounty_redeemer = CheckBurn

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
                metadata: [],
                version: 1,
                contributions: [Pair(mock_pub_key_hash(0), 102141)],
                pub_key_hash: mock_pub_key_hash(0),
              },
            ),
          ),
        )

  bounty_token.mint(
    (mock_policy_id(0), "oracle"),
    bounty_redeemer("contributor"),
    mock_policy_id(0),
    tx,
  )
}
