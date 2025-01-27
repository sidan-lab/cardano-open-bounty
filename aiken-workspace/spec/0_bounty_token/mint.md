# Mint bounty token

## parameter

Oracle NFT

## Datum

```rs
pub type BountyDatum {
  issue_url: Data,
  reward: Int,
}
```

## User Action

1. Mint - Redeemer

   - id_token must be provided
   - check Only one mint at the same time
   - output bounty token to bounty borad
   - check datum format

2. Burn - redeemer

   - input contains intent token, bounty token, contributor id ref token
   - ref input contains bounty owner id token
   - require bounty owner sign
   - check if bounty owner id token name and bounty token name match
   - check if intent token name and contributor id ref token name match
   - check if intent datum utxo and bounty token utxo match
   - check if output reward to contributor
   - check if contributor id ref datum is updated
   - bounty token and intent token is burnt
   - only one bounty, intent is input and burnt
