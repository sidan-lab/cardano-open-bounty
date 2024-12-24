# Identity Token - One Shot

## Parameter

## Datum

```rs
type ContributerDatum {
   github: String,
   contributions: List<Contribution>
}

type Contribution {
   signers: List<PubKeyHash>,
   amount: Int
}
```
 
## User Action 

Redeemer of Format: `pub_key_hash`: user's public key hash

1. Mint - Redeemer `RMint`
   - Check required signers for the `pub_key_hash` specified in redeemer
   - Check if mint one reference token and one nft only
   - Check policy id and asset prefix name 
   - Check that asset name == prefix + `pub_key_hash`
   - Check specific datum output at reference token is of `ContributerDatum` format

2. Burn - Redeemer `RBurn`
   - Check required signers for the `pub_key_hash` specified in redeemer
   - Check if mint one reference token and one nft only
   - Check policy id and asset prefix name
   - Check that asset name == prefix + `pub_key_hash`
