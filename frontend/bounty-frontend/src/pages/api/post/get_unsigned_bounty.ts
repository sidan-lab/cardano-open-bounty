import { NextApiRequest, NextApiResponse } from "next";
import { neon } from "@neondatabase/serverless";
import { ContributorRedeemed } from "@/pages/common/type";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    try {
      const { txHash, outputIndex } = req.body;
      const sql = neon(process.env.DATABASE_URL!);
      const queryResult = await sql(
        "SELECT * FROM unsigned_bounty WHERE txHash = $1 AND outputIndex= $2",
        [txHash, outputIndex]
      );

      if (queryResult.length > 0) {
        const contributorsRedeemed: ContributorRedeemed[] = [];
        queryResult.forEach((record) => {
          const {
            bountyName: bountyName,
            gitHub: gitHub,
            contributions: contributionsJSON,
            unsignedTx: unsignedTx,
            txHash: txHash,
            outputIndex: outputIndex,
          } = record[0];

          const contributions: Map<string, number> = new Map(
            JSON.parse(contributionsJSON)
          );

          const contributorRedeemed: ContributorRedeemed = {
            bountyName: bountyName,
            gitHub: gitHub,
            contributions: contributions,
            unsignedTx: unsignedTx,
            txHash: txHash,
            outputIndex: outputIndex,
          };

          contributorsRedeemed.push(contributorRedeemed);
        });

        res.status(200).json({ contributorsRedeemed });
      } else {
        res.status(404).json({ message: "Data not found" });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error getting data" });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
