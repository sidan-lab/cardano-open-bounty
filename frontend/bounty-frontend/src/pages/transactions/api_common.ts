import axios from "axios";

export const updateUtxoApiRoute = async (
  name: string,
  updatedOutputIndex: string,
  updatedTxHash: string
) => {
  const config = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  const res = await axios.post(
    "../api/post/update_utxo",
    JSON.stringify({
      name: name,
      updatedOutputIndex: updatedOutputIndex,
      updatedTxHash: updatedTxHash,
    }),
    config
  );
  console.log("update utxo res", res.data);
};

export const getUtxoApiRoute = async (
  name: string
): Promise<{ oracleOutputIndex: number; oracleTxHash: string }> => {
  const config = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  const res = await axios.post(
    "../api/post/get_utxo",
    JSON.stringify({
      name: name,
    }),
    config
  );
  const { oracleOutputIndex, oracleTxHash } = res.data;
  return { oracleOutputIndex, oracleTxHash };
};

export const insertUtxoApiRoute = async (
  name: string,
  outputIndex: string,
  txHash: string
) => {
  const config = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  const res = await axios.post(
    "../api/post/insert_utxo",
    JSON.stringify({
      name: name,
      outputIndex: outputIndex,
      txHash: txHash,
    }),
    config
  );
  console.log("insert utxo res", res.data);
};
