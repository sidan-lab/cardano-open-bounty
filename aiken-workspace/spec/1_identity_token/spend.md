# Specification - Identity Token CIP-68

## Parameter

## Datum

```rs
pub type ContributerDatum {
  metadata: Pairs<Data, Data>,
  // GitHub: ByteArray
  version: Int,
  contributions: Pairs<ByteArray, Int>,
  pub_key_hash: ByteArray,
}
```

## User Action

1. Update contributor

   - Output to id ref to ref holder
   - intent and bounty token are burnt
