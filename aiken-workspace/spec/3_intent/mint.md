# Specification - BountyIntent Token

## Parameter

- `oracle_nft`

## Datum

- `utxo`

## Contributor Action

1. Contributor Intent - Redeemer `RedeemBounty { limit_order: LimitOrder }`

   - Exactly 1 token minted
   - Asset Name must be id token asset name
   - Signed by contributor
   - Output to intent holder with datum {UTXO}

2. Accept intent

   - Burn 1 intent token
   - Burn 1 bounty token marked in datum

3. Cancel intent

   - Burn 1 intent token
   - Signed by contributor
