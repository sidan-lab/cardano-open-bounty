use cardano/address.{Address}
use cardano/assets.{PolicyId}

pub type Action {
  CheckMint
  CheckBurn
}

pub type OracleDatum {
  bounty_token_policy_id: PolicyId,
  bounty_board_address: Address,
  id_token_policy_id: PolicyId,
  id_token_store_address: Address,
  owner: Address,
}

pub type OracleCounterDatum {
  count: Int,
  owner: Address,
}

pub type OracleRedeemer {
  UpdateOracle
  StopOracle
}

pub type OracleCounterRedeemer {
  MintIDToken
  StopCounterOracle
}
