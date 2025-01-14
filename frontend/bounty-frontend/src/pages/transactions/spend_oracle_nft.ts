import { applyParamsToScript, OfflineEvaluator } from "@meshsdk/core-csl";
import blueprint from "../../../../../aiken-workspace/plutus.json";
import {
  BlockfrostProvider,
  IWallet,
  MeshTxBuilder,
  resolveScriptHash,
  stringToHex,
  deserializeAddress,
  applyCborEncoding,
  serializePlutusScript,
  mTuple,
} from "@meshsdk/core";
import axios from "axios";

export const spendOracleNFT = async (wallet: IWallet) => {
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

  const idSpendingScriptCbor = applyCborEncoding(
    blueprint.validators[7]!.compiledCode
  );

  const idSpendingScriptAddress = serializePlutusScript(
    {
      code: idSpendingScriptCbor,
      version: "V3",
    },
    undefined,
    0
  ).address;

  const idMintingScriptCbor = applyParamsToScript(
    blueprint.validators[5]!.compiledCode,
    [
      stringToHex(`${process.env.NEXT_PUBLIC_COLLECTION_NAME!}`),
      mTuple(
        process.env.NEXT_PUBLIC_ORACLE_NFT_POLICY_ID!,
        process.env.NEXT_PUBLIC_ORACLE_NFT_ASSET_NAME!
      ),
      process.env.NEXT_PUBLIC_ID_ORACLE_COUNTER_POLICY_ID!,
    ],
    "Mesh"
  );

  const bountyBoradScriptCbor = applyParamsToScript(
    blueprint.validators[1]!.compiledCode,
    [
      mTuple(
        process.env.NEXT_PUBLIC_ORACLE_NFT_POLICY_ID!,
        process.env.NEXT_PUBLIC_ORACLE_NFT_ASSET_NAME!
      ),
    ],
    "Mesh"
  );

  const bountyBoardScriptAddress = serializePlutusScript(
    {
      code: bountyBoradScriptCbor,
      version: "V3",
    },
    undefined,
    0
  ).address;

  const bountyMintingScriptCbor = applyParamsToScript(
    blueprint.validators[3]!.compiledCode,
    [
      mTuple(
        process.env.NEXT_PUBLIC_ORACLE_NFT_POLICY_ID!,
        process.env.NEXT_PUBLIC_ORACLE_NFT_ASSET_NAME!
      ),
    ],
    "Mesh"
  );

  const idMintingPolicyId = resolveScriptHash(idMintingScriptCbor, "V3");
  const bountyMintingPolicyId = resolveScriptHash(
    bountyMintingScriptCbor,
    "V3"
  );

  const oracleDatum = JSON.stringify({
    constructor: 0,
    fields: [
      {
        bytes: idMintingPolicyId,
      },
      {
        constructor: 0,
        fields: [
          {
            constructor: 1,
            fields: [
              {
                bytes: idSpendingScriptAddress,
              },
            ],
          },
          {
            constructor: 1,
            fields: [],
          },
        ],
      },
      {
        bytes: bountyMintingPolicyId,
      },
      {
        constructor: 0,
        fields: [
          {
            constructor: 1,
            fields: [
              {
                bytes: bountyBoardScriptAddress,
              },
            ],
          },
          {
            constructor: 1,
            fields: [],
          },
        ],
      },
      {
        constructor: 0,
        fields: [
          {
            constructor: 0,
            fields: [
              {
                bytes: pubKeyHash,
              },
            ],
          },
          {
            constructor: 1,
            fields: [
              {
                bytes: stakeCredentialHash,
              },
            ],
          },
        ],
      },
    ],
  });

  try {
    const { oracleOutputIndex, oracleTxHash } = await getUtxoApiRoute(
      process.env.NEXT_PUBLIC_ORACLE_NFT_ASSET_NAME!
    );

    const unsignedTx = await txBuilder
      .spendingPlutusScriptV3()
      .txIn(oracleTxHash, oracleOutputIndex)
      .txInRedeemerValue(
        JSON.stringify({
          constructor: 0,
          fields: [],
        }),
        "JSON"
      )
      .txInScript(OracleNFTSpendingScriptCbor)
      .txInInlineDatumPresent()
      .txOut(OracleNFTAddress, [
        {
          unit:
            process.env.NEXT_PUBLIC_ORACLE_NFT_POLICY_ID! +
            stringToHex(`${process.env.NEXT_PUBLIC_ORACLE_NFT_ASSET_NAME}`),
          quantity: "1",
        },
      ])
      .txOutInlineDatumValue(oracleDatum, "JSON")
      .txInCollateral(
        collateral.input.txHash,
        collateral.input.outputIndex,
        collateral.output.amount,
        collateral.output.address
      )
      .requiredSignerHash(pubKeyHash)
      .changeAddress(changeAddress)
      .selectUtxosFrom(utxos.slice(1))
      .complete();

    const signedTx = await wallet.signTx(unsignedTx, true);
    const txHash = await wallet.submitTx(signedTx);
    console.log(txHash);

    await updateUtxoApiRoute(
      process.env.NEXT_PUBLIC_ORACLE_NFT_ASSET_NAME!,
      "0",
      txHash
    );
  } catch (e) {
    console.error(e);
  }
};

const updateUtxoApiRoute = async (
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

const getUtxoApiRoute = async (
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
