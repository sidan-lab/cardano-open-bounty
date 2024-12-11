# Specification - Identity Token CIP-68

## Parameter

## Datum
```rs
type Asset {
  policy_id: ByteArray,
  asset_name: ByteArray,
}

type Extra {
  // Who has able to spend the UTxO that is holding CIP-68 Reference NFT  
  address: Address,
  // CIP-68 Reference NFT  
  nft: Asset,
}

// Followed by CIP-68 Metadata standard: https://github.com/cardano-foundation/CIPs/tree/master/CIP-0068
type ValidatorDatum {
  metadata: Pairs<ByteArray, Data>,
  version: Int,
  extra: Extra,
}
```
## Metadata
- `self_intro`: The self intro customized by owner
- `cum_earned`: The cumulative amount of bounty earned
- `prev_signed_off`: The information of previous sign-off people (those who approved the work and released bounty)


## User Action

1. Update contributor || bounty creator info  - Redeemer `metadata`

   - Validate UTxO has to hold the Reference NFT
   - Verify validity of datum of the referenced output by checking if policy ID of reference NFT and user token and their asset names without the asset_name_label prefix match
