# Specification - Identity Token CIP-68

## Parameter

## Datum

```rs

type Redeemer {
  bounty_nft: Asset,
  id_nft: Asset
}

// Followed by CIP-68 Metadata standard: https://github.com/cardano-foundation/CIPs/tree/master/CIP-0068
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

1. Update contributor || bounty creator info

   - Validate UTxO has to hold the Reference NFT
   - Verify validity of datum of the referenced output by checking if policy ID of reference NFT and user token and their asset names without the asset_name_label prefix match
   - ..
