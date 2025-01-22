import { NextApiRequest, NextApiResponse } from "next";
import { neon } from "@neondatabase/serverless";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    try {
      console.log("aaaaa");

      const { name } = req.body;
      const sql = neon(process.env.DATABASE_URL!);
      const queryResult = await sql(
        "SELECT outputindex, txhash FROM cardano_open_bounty WHERE name = $1",
        [name]
      );

      if (queryResult.length > 0) {
        const { outputindex: oracleOutputIndex, txhash: oracleTxHash } =
          queryResult[0];
        res
          .status(200)
          .json({ oracleOutputIndex: Number(oracleOutputIndex), oracleTxHash });
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
