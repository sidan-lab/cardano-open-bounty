import { NextApiRequest, NextApiResponse } from "next";
import { neon } from "@neondatabase/serverless";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    try {
      const { name, outputIndex, txHash } = req.body;
      const id = name == process.env.NEXT_PUBLIC_ORACLE_NFT_ASSET_NAME ? 1 : 2;
      const sql = neon(process.env.DATABASE_URL!);
      await sql(
        "INSERT INTO cardano_open_bounty (id, name, outputindex, txhash) VALUES ($1::int, $2, $3, $4);",
        [id, name, outputIndex, txHash]
      );

      res.status(200).json({ message: "Data inserted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error inserting data" });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
