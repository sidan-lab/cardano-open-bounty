# Specification - BountyIntent Token

## Parameter

- `oracle_nft`

## Datum

- `utxo`
- `address`

## Contributor Action

1. Contributor Intent - Redeemer `RedeemBounty`

   - Exactly 1 token minted
   - Asset Name must be id token asset name
   - Signed by contributor
   - Output to intent holder with datum {UTXO}
   - Datum stores UTXO of bounty token

2. Accept intent - Redeemer `AccpetRedeem`

   - Burn 1 intent token
   - Burn 1 bounty token marked in datum

3. Cancel intent - Redeemer `CancelRedeem`

   - Burn 1 intent token
   - Signed by contributor
