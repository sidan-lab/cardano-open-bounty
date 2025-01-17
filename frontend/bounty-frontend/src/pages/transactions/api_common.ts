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

export const updateMultiSigApiRoute = async (
  bountyName: string,
  updatedSignedTx: string,
  updatedRequiredSigner: string[]
) => {
  const config = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  const res = await axios.post(
    "../api/post/update_multisig",
    JSON.stringify({
      bountyName: bountyName,
      updatedSignedTx: updatedSignedTx,
      updatedRequiredSigner: updatedRequiredSigner,
    }),
    config
  );
  console.log("update multisig res", res.data);
};

export const getMultiSigApiRoute = async (
  bountyName: string
): Promise<{ signedTx: string; requiredSigner: string[] }> => {
  const config = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  const res = await axios.post(
    "../api/post/get_multisig",
    JSON.stringify({
      bountyName: bountyName,
    }),
    config
  );
  const { signedTx, requiredSigner } = res.data;
  return { signedTx, requiredSigner };
};

export const insertMultiSigApiRoute = async (
  bountyName: string,
  requiredSigner: string[]
) => {
  const config = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  const res = await axios.post(
    "../api/post/insert_multisig",
    JSON.stringify({
      bountyName: bountyName,
      requiredSigner: requiredSigner,
    }),
    config
  );
  console.log("insert multisig res", res.data);
};

export const deleteMultiSigApiRoute = async (bountyName: string) => {
  const config = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  const res = await axios.post(
    "../api/post/delete_multisig",
    JSON.stringify({
      bountyName: bountyName,
    }),
    config
  );
  console.log("delete multisig res", res.data);
};
