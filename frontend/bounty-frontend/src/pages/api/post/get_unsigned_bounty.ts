import { NextApiRequest, NextApiResponse } from "next";
import { neon } from "@neondatabase/serverless";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    try {
      const { txHash, outputIndex } = req.body;
      const sql = neon(process.env.DATABASE_URL!);
      const queryResult = await sql(
        "SELECT bountyName, gitHub, contributions, unsignedTx, txHash, outputIndex FROM unsigned_bounty WHERE txHash = $1 AND outputIndex= $2",
        [txHash, outputIndex]
      );

      if (queryResult.length > 0) {
        res.status(200).json({ queryResult });
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
