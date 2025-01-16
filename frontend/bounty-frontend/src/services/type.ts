export type AssetTransaction = {
  tx_hash: string;
  tx_index: number;
  block_height: number;
  block_time: number;
};

export type Contribution = {
  all_signatories: string[];
  reward: number;
};

export type Bounty = {
  issue_url: string;
  reward: number;
  all_signatories: string[];
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
