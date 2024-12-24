# Mint bounty token

## parameter
Oracle NFT

## User Action:
1. Mint - Redeemer

    id_token must be provided

    check is the user pkh match the id_token asset name (pkh)
    {
        token.value -> get assetname from oracle
        remove cip222 -> get pkh 
        redeemer.pkh == this.pkh
    } - > MInt bounty token(assetname,policyid)


2. Burn - redeemer
    check same pkh and policy id NFT
    -> burn

  
3. Output contain money, minted NFT,
    write datum
    (
        creater github
        bounty money  
    )

## Requirement:
1. Only one bounty token mint at the same time
2. bounty token can be minted iff user input provide valid ID token
3. only send to bounty board address 
