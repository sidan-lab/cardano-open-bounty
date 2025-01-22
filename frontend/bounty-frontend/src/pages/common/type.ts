export type ContributorRedeemed = {
  name: string;
  gitHub: string;
  contributions: Map<string, number>;
  txHash: string;
};
