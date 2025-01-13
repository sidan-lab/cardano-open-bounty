import { NextApiRequest, NextApiResponse } from "next";
import { Client } from "@neondatabase/serverless";
import { applyParamsToScript, OfflineEvaluator } from "@meshsdk/core-csl";
import blueprint from "../../../../../aiken-workspace/plutus.json";
import {
  BlockfrostProvider,
  BrowserWallet,
  MeshTxBuilder,
  resolveScriptHash,
  stringToHex,
  deserializeAddress,
  applyCborEncoding,
  serializePlutusScript,
  mConStr0,
  mOutputReference,
  Data,
  mPubKeyAddress,
} from "@meshsdk/core";
// import { ActionMint } from "./type";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    try {
      const { transactionHash } = req.body;
      const client = new Client(process.env.DATABASE_URL);
      await client.connect();
      await client.query("INSERT INTO transactions (hash) VALUES ($1)", [
        transactionHash,
      ]);
      res.status(201).json({ message: "Transaction hash saved successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error saving transaction hash" });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}

export const mintOracleNFT = async (wallet: BrowserWallet) => {
  if (!wallet) {
    alert("Please connect your wallet");
    return;
  }
  if (!process.env.NEXT_PUBLIC_BLOCKFROST_API_KEY) {
    alert("Please set up environment variables");
    return;
  }

  // Set up tx builder with blockfrost support
  const blockfrost: BlockfrostProvider = new BlockfrostProvider(
    process.env.NEXT_PUBLIC_BLOCKFROST_API_KEY,
    0
  );
  const txBuilder: MeshTxBuilder = new MeshTxBuilder({
    fetcher: blockfrost,
    submitter: blockfrost,
    evaluator: new OfflineEvaluator(blockfrost, "preprod"),
  });

  const changeAddress = await wallet.getChangeAddress();
  const utxos = await wallet.getUtxos();
  const collateral = (await wallet.getCollateral())[0];
  const usedAddress = (await wallet.getUsedAddresses())[0];
  const { pubKeyHash, stakeCredentialHash } = deserializeAddress(usedAddress);

  const paramUtxo = utxos[0]!;
  const param: Data = mOutputReference(
    paramUtxo.input.txHash,
    paramUtxo.input.outputIndex
  );

  const OracleNFTSpendingScriptCbor = applyCborEncoding(
    blueprint.validators[16]!.compiledCode
  );

  const OracleNFTAddress = serializePlutusScript(
    {
      code: OracleNFTSpendingScriptCbor,
      version: "V3",
    },
    undefined,
    0
  ).address;

  const OracleNFTMintingScriptCbor = applyParamsToScript(
    blueprint.validators[14]!.compiledCode,
    [param]
  );

  const OracleNFTPolicyId = resolveScriptHash(OracleNFTMintingScriptCbor, "V3");
  console.log(OracleNFTPolicyId);

  try {
    const unsignedTx = await txBuilder
      .txIn(
        paramUtxo.input.txHash,
        paramUtxo.input.outputIndex,
        paramUtxo.output.amount,
        paramUtxo.output.address
      )
      .mintPlutusScriptV3()
      .mint("1", OracleNFTPolicyId, stringToHex("oracle_nft"))
      .mintingScript(OracleNFTMintingScriptCbor)
      .mintRedeemerValue(
        JSON.stringify({
          constructor: 0,
          fields: [],
        }),
        "JSON"
      )
      .txOut(OracleNFTAddress, [
        { unit: OracleNFTPolicyId + stringToHex("oracle_nft"), quantity: "1" },
      ])
      .txOutInlineDatumValue(
        mConStr0([mPubKeyAddress(pubKeyHash, stakeCredentialHash)])
      )
      .txInCollateral(
        collateral.input.txHash,
        collateral.input.outputIndex,
        collateral.output.amount,
        collateral.output.address
      )
      .changeAddress(changeAddress)
      .selectUtxosFrom(utxos)
      .complete();

    const signedTx = await wallet.signTx(unsignedTx, true);
    const txHash = await wallet.submitTx(signedTx);

    console.log(unsignedTx);
    console.log(paramUtxo.input);
    console.log(txHash);
    return { tx: unsignedTx, paramUtxo: paramUtxo.input };
  } catch (e) {
    console.error(e);
  }
};

export const mintOracleCounter = async (wallet: BrowserWallet) => {
  if (!wallet) {
    alert("Please connect your wallet");
    return;
  }
  if (!process.env.NEXT_PUBLIC_BLOCKFROST_API_KEY) {
    alert("Please set up environment variables");
    return;
  }

  // Set up tx builder with blockfrost support
  const blockfrost: BlockfrostProvider = new BlockfrostProvider(
    process.env.NEXT_PUBLIC_BLOCKFROST_API_KEY,
    0
  );
  const txBuilder: MeshTxBuilder = new MeshTxBuilder({
    fetcher: blockfrost,
    submitter: blockfrost,
    evaluator: new OfflineEvaluator(blockfrost, "preprod"),
  });

  const changeAddress = await wallet.getChangeAddress();
  const utxos = await wallet.getUtxos();
  const collateral = (await wallet.getCollateral())[0];
  const usedAddress = (await wallet.getUsedAddresses())[0];
  const { pubKeyHash, stakeCredentialHash } = deserializeAddress(usedAddress);

  const paramUtxo = utxos[0]!;
  const param: Data = mOutputReference(
    paramUtxo.input.txHash,
    paramUtxo.input.outputIndex
  );

  const idOracleCounterSpendingScriptCbor = applyCborEncoding(
    blueprint.validators[12]!.compiledCode
  );

  const idOracleCounterAddress = serializePlutusScript(
    {
      code: idOracleCounterSpendingScriptCbor,
      version: "V3",
    },
    undefined,
    0
  ).address;

  const idOracleCounterMintingScriptCbor = applyParamsToScript(
    blueprint.validators[14]!.compiledCode,
    [param]
  );

  const idOracleCounterPolicyId = resolveScriptHash(
    idOracleCounterMintingScriptCbor,
    "V3"
  );

  try {
    const unsignedTx = await txBuilder
      .txIn(
        paramUtxo.input.txHash,
        paramUtxo.input.outputIndex,
        paramUtxo.output.amount,
        paramUtxo.output.address
      )
      .mintPlutusScriptV3()
      .mint("1", idOracleCounterPolicyId, stringToHex("id_oracle_counter"))
      .mintingScript(idOracleCounterMintingScriptCbor)
      .mintRedeemerValue(
        JSON.stringify({
          constructor: 0,
          fields: [],
        }),
        "JSON"
      )
      .txOut(idOracleCounterAddress, [
        { unit: idOracleCounterPolicyId, quantity: "1" },
      ])
      .txOutInlineDatumValue(
        mConStr0([mPubKeyAddress(pubKeyHash, stakeCredentialHash)])
      )
      .txInCollateral(
        collateral.input.txHash,
        collateral.input.outputIndex,
        collateral.output.amount,
        collateral.output.address
      )
      .changeAddress(changeAddress)
      .selectUtxosFrom(utxos)
      .complete();

    const signedTx = await wallet.signTx(unsignedTx, true);
    const txHash = await wallet.submitTx(signedTx);

    console.log(unsignedTx);
    console.log(paramUtxo.input);
    console.log(txHash);
    return { tx: unsignedTx, paramUtxo: paramUtxo.input };
  } catch (e) {
    console.error(e);
  }
};
