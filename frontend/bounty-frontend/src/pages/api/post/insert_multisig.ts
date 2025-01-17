import { NextApiRequest, NextApiResponse } from "next";
import { neon } from "@neondatabase/serverless";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    try {
      const {
        bountyName,
        signedTx,
        requiredSigner,
        txHash,
        outputIndex,
        contributor,
      } = req.body;
      const sql = neon(process.env.DATABASE_URL!);

      const requiredSignersJSON = JSON.stringify(requiredSigner);

      await sql(
        "INSERT INTO bounty_multi_signature (bountyName, signedTx, requiredSigner, txHash, outputIndex, contributor) VALUES ($1, $2, $3, $4, $5, $6);",
        [
          bountyName,
          signedTx,
          requiredSignersJSON,
          txHash,
          outputIndex,
          contributor,
        ]
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
