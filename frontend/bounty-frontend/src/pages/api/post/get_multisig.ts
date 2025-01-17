import { NextApiRequest, NextApiResponse } from "next";
import { neon } from "@neondatabase/serverless";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    try {
      const { bountyName } = req.body;
      const sql = neon(process.env.DATABASE_URL!);
      const queryResult = await sql(
        "SELECT signedTx, requiredSigner FROM bounty_multi_signature WHERE bountyName = $1",
        [bountyName]
      );

      if (queryResult.length > 0) {
        const { signedTx: signedTx, requiredSigner: requiredSignersJSON } =
          queryResult[0];

        const requiredSigner = JSON.parse(requiredSignersJSON);

        res.status(200).json({ signedTx, requiredSigner });
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
