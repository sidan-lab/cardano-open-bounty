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
  mOutputReference,
  Data,
  mTuple,
} from "@meshsdk/core";
import { neon } from "@neondatabase/serverless";

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

  const oracleDatum = JSON.stringify({
    constructor: 0,
    fields: [
      {
        bytes: "",
      },
      {
        constructor: 0,
        fields: [
          {
            constructor: 1,
            fields: [
              {
                bytes: "",
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
        bytes: "",
      },
      {
        constructor: 0,
        fields: [
          {
            constructor: 1,
            fields: [
              {
                bytes: "",
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
    const unsignedTx = await txBuilder
      .txIn(
        paramUtxo.input.txHash,
        paramUtxo.input.outputIndex,
        paramUtxo.output.amount,
        paramUtxo.output.address
      )
      .mintPlutusScriptV3()
      .mint(
        "1",
        OracleNFTPolicyId,
        stringToHex(`${process.env.ORACLE_NFT_ASSET_NAME}`)
      )
      .mintingScript(OracleNFTMintingScriptCbor)
      .mintRedeemerValue(
        JSON.stringify({
          constructor: 0,
          fields: [],
        }),
        "JSON"
      )
      .txOut(OracleNFTAddress, [
        {
          unit:
            OracleNFTPolicyId +
            stringToHex(`${process.env.ORACLE_NFT_ASSET_NAME}`),
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
      .changeAddress(changeAddress)
      .selectUtxosFrom(utxos)
      .complete();

    const signedTx = await wallet.signTx(unsignedTx, true);
    const txHash = await wallet.submitTx(signedTx);
    console.log(txHash);
    console.log(OracleNFTPolicyId);
    const sql = neon(`${process.env.DATABASE_URL}`);
    await sql(
      "INSERT INTO cardano_open_bounty (name, outputindex, txhash) VALUES ($1, $2, $3)",
      [
        `${process.env.ORACLE_NFT_ASSET_NAME}`,
        paramUtxo.input.outputIndex,
        paramUtxo.input.txHash,
      ]
    );
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

  const oracleDatum = JSON.stringify({
    constructor: 0,
    fields: [
      {
        int: 0,
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
    const unsignedTx = await txBuilder
      .txIn(
        paramUtxo.input.txHash,
        paramUtxo.input.outputIndex,
        paramUtxo.output.amount,
        paramUtxo.output.address
      )
      .mintPlutusScriptV3()
      .mint("1", idOracleCounterPolicyId, stringToHex(""))
      .mintingScript(idOracleCounterMintingScriptCbor)
      .mintRedeemerValue(
        JSON.stringify({
          constructor: 0,
          fields: [],
        }),
        "JSON"
      )
      .txOut(idOracleCounterAddress, [
        {
          unit: idOracleCounterPolicyId + stringToHex(""),
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
      .changeAddress(changeAddress)
      .selectUtxosFrom(utxos)
      .complete();

    const signedTx = await wallet.signTx(unsignedTx, true);
    const txHash = await wallet.submitTx(signedTx);

    console.log(txHash);
    console.log(idOracleCounterPolicyId);

    const sql = neon(`${process.env.DATABASE_URL}`);
    await sql(
      "INSERT INTO cardano_open_bounty (name, outputindex, txhash) VALUES ($1, $2, $3)",
      [
        `${process.env.ID_ORACLE_COUNTER_ASSET_NAME}`,
        paramUtxo.input.outputIndex,
        paramUtxo.input.txHash,
      ]
    );
  } catch (e) {
    console.error(e);
  }
};

export const spendOracleNFT = async (wallet: BrowserWallet) => {
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
      stringToHex(`${process.env.COLLECTION_NAME!}`),
      mTuple(
        process.env.ORACLE_NFT_POLICY_ID!,
        process.env.ORACLE_NFT_ASSET_NAME!
      ),
      process.env.ID_ORACLE_COUNTER_POLICY_ID!,
    ],
    "Mesh"
  );

  const bountyBoradScriptCbor = applyParamsToScript(
    blueprint.validators[1]!.compiledCode,
    [
      mTuple(
        process.env.ORACLE_NFT_POLICY_ID!,
        process.env.ORACLE_NFT_ASSET_NAME!
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
        process.env.ORACLE_NFT_POLICY_ID!,
        process.env.ORACLE_NFT_ASSET_NAME!
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
    const sql = neon(`${process.env.DATABASE_URL}`);
    const queryResult = await sql(
      "SELECT output_index, tx_hash FROM your_table_name WHERE name = $1",
      [`${process.env.ORACLE_NFT_ASSET_NAME}`]
    );

    const { output_index: oracleOutputIndex, tx_hash: oracleTxHash } =
      queryResult[0];

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
            process.env.ORACLE_NFT_POLICY_ID! +
            stringToHex(`${process.env.ORACLE_NFT_ASSET_NAME}`),
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
      .selectUtxosFrom(utxos)
      .complete();

    const signedTx = await wallet.signTx(unsignedTx, true);
    const txHash = await wallet.submitTx(signedTx);
    console.log(txHash);

    const updatedOutputIndex = 0;
    const updatedTxHash = txHash;
    const nftAssetName = process.env.ORACLE_NFT_ASSET_NAME;

    await sql(
      "UPDATE your_table_name SET output_index = $1, tx_hash = $2 WHERE name = $3",
      [updatedOutputIndex, updatedTxHash, nftAssetName]
    );
  } catch (e) {
    console.error(e);
  }
};
