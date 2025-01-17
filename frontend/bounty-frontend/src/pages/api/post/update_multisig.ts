import { NextApiRequest, NextApiResponse } from "next";
import { neon } from "@neondatabase/serverless";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    try {
      const { bountyName, signedTx, requiredSigner } = req.body;
      const sql = neon(process.env.DATABASE_URL!);
      await sql(
        "UPDATE bounty_multi_signature SET signedTx = $1, requiredSigner = $2 WHERE bountyName = $3",
        [signedTx, requiredSigner, bountyName]
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
