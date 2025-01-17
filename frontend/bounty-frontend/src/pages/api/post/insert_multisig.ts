import { NextApiRequest, NextApiResponse } from "next";
import { neon } from "@neondatabase/serverless";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    try {
      const { bountyName, requiredSigner } = req.body;
      const sql = neon(process.env.DATABASE_URL!);
      await sql(
        "INSERT INTO bounty_multi_signature (bountyName, requiredSigner) VALUES ($1, $2);",
        [bountyName, requiredSigner]
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
