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
        const {
          bountyName: bountyName,
          gitHub: gitHub,
          contributions: contributionsJSON,
          unsignedTx: unsignedTx,
          txHash: txHash,
          outputIndex: outputIndex,
        } = queryResult[0];

        const contributions = JSON.parse(contributionsJSON);

        const contributorRedeemed: ContributorRedeemed = {
          bountyName: bountyName,
          gitHub: gitHub,
          contributions: contributions,
          unsignedTx: unsignedTx,
          txHash: txHash,
          outputIndex: outputIndex,
        };

        res.status(200).json({ contributorRedeemed });
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
