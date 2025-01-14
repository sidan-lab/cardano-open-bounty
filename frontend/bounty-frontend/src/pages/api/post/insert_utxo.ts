import { NextApiRequest, NextApiResponse } from "next";
import { neon } from "@neondatabase/serverless";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    try {
      const { name, outputIndex, txHash } = req.body;
      const sql = neon(process.env.DATABASE_URL!);
      await sql(
        "INSERT INTO cardano_open_bounty (name, outputindex, txhash) VALUES ($1, $2, $3);",
        [name, outputIndex, txHash]
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
