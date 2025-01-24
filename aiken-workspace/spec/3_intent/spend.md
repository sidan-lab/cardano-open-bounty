# Specification - BountyIntent Token

## Parameter

- `oracle_nft`

## Datum - Either

- Same as `HydraOrderBook`'s `LimitOrder` with an extra field of `order_id`
- `WithdrawalIntent { amount: MValue }`

## User Action

1. Process Intent

   - `Intent` token in own input is burnt
