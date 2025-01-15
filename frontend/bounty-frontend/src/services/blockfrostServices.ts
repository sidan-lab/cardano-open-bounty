import { OracleCounterDatum } from "@/pages/api/type";
import { BlockfrostProvider, deserializeDatum } from "@meshsdk/core";

export class BlockfrostService {
  blockFrost: BlockfrostProvider;

  getOracleCounterNum = async (
    txHash: string,
    index: number
  ): Promise<{ count: number }> => {
    try {
      const utxo = await this.blockFrost.fetchUTxOs(txHash, index);

      const datum = utxo[0].output.plutusData!;

      const data: OracleCounterDatum = deserializeDatum(datum);
      const count = Number(data.fields[0].int);

      return { count };
    } catch (error) {
      console.error("Error fetching count:", error);
      throw error;
    }
  };

  getIdTokenInfo = async (
    txHash: string,
    index: number
  ): Promise<{ count: number }> => {
    try {
      // todo
    } catch (error) {
      console.error("Error fetching count:", error);
      throw error;
    }
  };

  getAllBountyToken = async (
    txHash: string,
    index: number
  ): Promise<{ count: number }> => {
    try {
      // todo
    } catch (error) {
      console.error("Error fetching count:", error);
      throw error;
    }
  };

  constructor() {
    this.blockFrost = new BlockfrostProvider(
      process.env.NEXT_PUBLIC_BLOCKFROST_API_KEY!
    );
  }
}
