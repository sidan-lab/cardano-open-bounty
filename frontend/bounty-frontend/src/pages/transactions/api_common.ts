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
  updatedRequiredSigner: string[],
  contributor: string
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
      contributor: contributor,
    }),
    config
  );
  console.log("update multisig res", res.data);
};

export const getMultiSigApiRoute = async (
  bountyName: string,
  contributor: string
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
      contributor: contributor,
    }),
    config
  );
  const { signedTx, requiredSigner } = res.data;
  return { signedTx, requiredSigner };
};

export const getMultiSigTxApiRoute = async (
  bountyName: string
): Promise<{ outputIndex: number; txHash: string }> => {
  const config = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  const res = await axios.post(
    "../api/post/get_multisig_tx",
    JSON.stringify({
      bountyName: bountyName,
    }),
    config
  );
  const { outputIndex, txHash } = res.data;
  return { outputIndex, txHash };
};

export const insertMultiSigApiRoute = async (
  bountyName: string,
  requiredSigner: string[],
  txHash: string,
  outputIndex: string
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
      signedTx: null,
      requiredSigner: requiredSigner,
      txHash: txHash,
      outputIndex: outputIndex,
      contributor: null,
    }),
    config
  );
  console.log("insert multisig res", res.data);
};

export const insertRedeemMultiSigApiRoute = async (
  bountyName: string,
  signedTx: string,
  requiredSigner: string[],
  contributor: string
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
      signedTx: signedTx,
      requiredSigner: requiredSigner,
      txHash: null,
      outputIndex: null,
      contributor: contributor,
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
