# Identity Token - One Shot

## Parameter

```rs
validator id_oracle_counter(OutputReference)
```

## Datum

```rs
pub type CounterDatum {
   count: Int
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

1. Mint - Redeemer `RMint`

   - Check input has id_oracle_counter
   - Check output datum.count ++
   - Check output datum format
   - Check output only to output_ref

2.
