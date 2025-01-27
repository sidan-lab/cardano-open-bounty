# Mint bounty token

## parameter

Oracle NFT

## User Action

1. Mint - Redeemer

   - id_token must be provided

   - check Only one mint at the same time

   - remove prefix get index and github from redeemer

   - check github

   -> MInt bounty token(assetname,policyid)

2. Burn - redeemer

   - check id token
   - check signatories
   - check contributer datum is update correct
   - intent token is burnt

   -> burn

3. Output contain money, minted NFT,
   write datum(
   - creater github
   - bounty money  
     )

## Requirement

1. Only one bounty token mint at the same time
2. bounty token can be minted iff user input provide valid ID token
3. only send to bounty board address
