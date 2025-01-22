export type ContributorRedeemed = {
  bountyName: string;
  gitHub: string;
  contributions: Map<string, number>;
  unsignedTx: string;
  txHash: string;
  outputIndex: number;
};
