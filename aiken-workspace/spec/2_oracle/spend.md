# Identity Token - One Shot

## Parameter

```rs
validator id_oracle_counter(OutputReference)
```

## Datum

```rs
pub type OracleDatum {
  bounty_token_policy_id: PolicyId,
  bounty_board_address: Address,
  id_token_policy_id: PolicyId,
  id_token_store_address: Address,
}

```

## Redeemer

```rs
pub type OracleRedeemer {
  MintNFT
  StopOracle
}
```

## User Action

1. MintNFT - Redeemer

   - Check input has oracle
   - Check output datum format
   - Check output only to output_ref

2. StopOracle - Redeemer
   - Check if the oracle is burnt
