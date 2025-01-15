import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    res.status(200).json({ message: "hello world" });
  } catch (error) {
    res.status(500).json(error);
  }
}
