# Identity Token - One Shot

## Parameter

```rs
validator identity_token(collection_name: ByteArray, oracle_nft: (PolicyId, AssetName), oracle_counter: (PolicyId, AssetName))
```

## Datum

```rs
pub type ContributerDatum {
   github: String,
   contributions: List<Contribution>
}

pub type Contribution {
   signers: List<PubKeyHash>,
   amount: Int
}
```

## User Action

1. Mint - Redeemer `RMint`

   - Check if mint one reference token and one nft only
   - Check policy id and asset prefix name (collection_name)
   - Check that asset name == prefix + oracle_counter.index
   - Check specific datum output at reference token is of `ContributerDatum` format
   - Check output to oracle_nft.id_token_store_address

2. Burn - Redeemer `RBurn`
   - Check if burn one reference token and one nft only
   - Check policy id and asset prefix name
   - Check that asset name == prefix + oracle_counter.index
