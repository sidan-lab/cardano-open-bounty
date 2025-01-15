import { NextApiRequest, NextApiResponse } from "next";
import { neon } from "@neondatabase/serverless";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    try {
      const { name, updatedOutputIndex, updatedTxHash } = req.body;
      const sql = neon(process.env.DATABASE_URL!);
      await sql(
        "UPDATE cardano_open_bounty SET outputindex = $1, txhash = $2 WHERE name = $3",
        [updatedOutputIndex, updatedTxHash, name]
      );

      res.status(200).json({ message: "Data updated successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error updating data" });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
