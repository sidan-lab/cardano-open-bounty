export type AssetTransaction = {
  tx_hash: string;
  tx_index: number;
  block_height: number;
  block_time: number;
};

export type AddressUtxo = {
  address: string;
  tx_hash: string;
  output_index: number;
  amount: {
    unit: string;
    quantity: string;
  }[];
  block: string;
  data_hash: string | null;
  inline_datum: string | null;
  reference_script_hash: string | null;
};

export type BountyWithName = {
  name: string;
  issue_url: string;
  reward: number;
  txHash: string;
  outputIndex: number;
};
