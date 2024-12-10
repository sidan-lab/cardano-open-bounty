# Specification - AppOracle

## Parameter

## Datum

- `operation_key`: The key for operation use. E.g. processing orders
- `stop_key`: The key for stopping the services
- `oracle_nft`: The policy id of `OracleNFT`
- `oracle_address`: The address of the current oracle validator
- `app_vault_address`: The address of `AppVault`
- `app_deposit_request_token`: The policy id of auth token at address of `AppDepositRequest`
- `app_deposit_request_address`: The address of `AppDepositRequest`
- `dex_net_deposit_token`: The policy id of auth token at address of `DexNetDeposit`
- `dex_net_deposit_address`: The address of `DexNetDeposit`
- `dex_account_balance_token`: The policy id of auth token at address of `DexAccountBalance`
- `dex_account_balance_address`: The address of `DexAccountBalance`
- `dex_order_book_token`: The policy id of auth token at address of `DexOrderBook`
- `dex_order_book_address`: The address of `DexOrderBook`
- `all_withdrawal_script_hashes`: To store all staking script hashes
<!-- - `all_token_indices`: To store all token indices -->

## User Action

1. Rotate operation and stop keys - Redeemer `DexRotateKey {new_operation_key, new_stop_key}`

   - Only 1 input from oracle address
   - The only 1 output datum is updated with new operation key and stop key
   - Required signers include both original and the new stop key

2. Stop the oracle validator - Redeemer `StopDex`

   - The transaction is signed by stop key
   - The `OracleNFT` is burnt