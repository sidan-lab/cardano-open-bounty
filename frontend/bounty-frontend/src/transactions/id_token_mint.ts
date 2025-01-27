import { OfflineEvaluator } from "@meshsdk/core-csl";
import {
  BlockfrostProvider,
  IWallet,
  MeshTxBuilder,
  stringToHex,
  CIP68_100,
  CIP68_222,
  deserializeAddress,
} from "@meshsdk/core";
import {
  getUtxoApiRoute,
  updateUtxoApiRoute,
} from "../pages/common/api_common";
import { ApiMiddleware } from "@/middleware/api";
import {
  actionUpdate,
  contributorDatum,
  ContributorDatum,
  GitHub,
  IdRedeemrMint,
  idRedeemrMint,
  oracleCounterDatum,
  OracleCounterDatum,
} from "./types";
import {
  getIdMintingPolicyId,
  getIdMintingRefScriptTx,
  getIdMintingScriptCbor,
  getIdMintingScriptHash,
  getIdOracleCounterAddress,
  getIdOracleCounterSpendingScriptCbor,
  getIdSpendingScriptAddress,
} from "./common";

export const mintIdToken = async (
  idName: string,
  gitHub: string,
  wallet: IWallet
) => {
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
    verbose: true,
  });

  const changeAddress = await wallet.getChangeAddress();
  const utxos = await wallet.getUtxos();
  const collateral = (await wallet.getCollateral())[0];
  const usedAddress =
    (await wallet.getUsedAddresses()).length === 0
      ? (await wallet.getUnusedAddresses())[0]
      : (await wallet.getUsedAddresses())[0];
  const { pubKeyHash } = deserializeAddress(usedAddress);

  const idOracleCounterSpendingScriptCbor =
    getIdOracleCounterSpendingScriptCbor();
  const idMintingScriptCbor = getIdMintingScriptCbor();

  const idMintingPolicyId = getIdMintingPolicyId();

  const idOracleCounterAddress = getIdOracleCounterAddress();
  const idSpendingScriptAddress = getIdSpendingScriptAddress();

  const idMintingScriptHash = getIdMintingScriptHash();
  const [idMintingScriptTxHash, idMintingScriptOutputIndex] =
    getIdMintingRefScriptTx();

  const api = new ApiMiddleware(wallet);
  try {
    const oracleResult = await getUtxoApiRoute(
      process.env.NEXT_PUBLIC_ORACLE_NFT_ASSET_NAME!
    );

    const counterResult = await getUtxoApiRoute(
      process.env.NEXT_PUBLIC_ID_ORACLE_COUNTER_ASSET_NAME!
    );

    const { count } = await api.getOracleCounterNum(
      counterResult.oracleTxHash,
      counterResult.oracleOutputIndex
    );

    const updatedOracleDatum: OracleCounterDatum = oracleCounterDatum(
      count + 1,
      process.env.NEXT_PUBLIC_PUB_KEY_HASH!
    );

    const idOutputDatum: ContributorDatum = contributorDatum(
      new Map([[GitHub, gitHub]]),
      1,
      new Map(),
      pubKeyHash
    );

    const idReemder: IdRedeemrMint = idRedeemrMint(idName);

    const unsignedTx = await txBuilder
      .readOnlyTxInReference(
        oracleResult.oracleTxHash,
        oracleResult.oracleOutputIndex
      )
      .spendingPlutusScriptV3()
      .txIn(counterResult.oracleTxHash, counterResult.oracleOutputIndex)
      .txInRedeemerValue(actionUpdate, "JSON")
      .txInScript(idOracleCounterSpendingScriptCbor)
      .txInInlineDatumPresent()
      .mintPlutusScriptV3()
      .mint(
        "1",
        idMintingPolicyId,
        CIP68_100(stringToHex(idName + count.toString()))
      )
      .mintTxInReference(
        idMintingScriptTxHash,
        idMintingScriptOutputIndex,
        (idMintingScriptCbor.length / 2).toString(),
        idMintingScriptHash
      )
      .mintRedeemerValue(idReemder, "JSON")
      .mintPlutusScriptV3()
      .mint(
        "1",
        idMintingPolicyId,
        CIP68_222(stringToHex(idName + count.toString()))
      )
      .mintTxInReference(
        idMintingScriptTxHash,
        idMintingScriptOutputIndex,
        (idMintingScriptCbor.length / 2).toString(),
        idMintingScriptHash
      )
      .mintRedeemerValue(idReemder, "JSON")
      .txOut(idOracleCounterAddress, [
        {
          unit:
            process.env.NEXT_PUBLIC_ID_ORACLE_COUNTER_POLICY_ID! +
            stringToHex(""),
          quantity: "1",
        },
      ])
      .txOutInlineDatumValue(updatedOracleDatum, "JSON")
      .txOut(idSpendingScriptAddress, [
        {
          unit:
            idMintingPolicyId +
            CIP68_100(stringToHex(idName + count.toString())),
          quantity: "1",
        },
      ])
      .txOutInlineDatumValue(idOutputDatum, "JSON")
      .requiredSignerHash(pubKeyHash)
      .txInCollateral(
        collateral.input.txHash,
        collateral.input.outputIndex,
        collateral.output.amount,
        collateral.output.address
      )
      .changeAddress(changeAddress)
      .selectUtxosFrom(utxos.slice(1))
      .complete();

    const signedTx = await wallet.signTx(unsignedTx, true);
    const txHash = await wallet.submitTx(signedTx);
    console.log(txHash);

    await updateUtxoApiRoute(
      process.env.NEXT_PUBLIC_ID_ORACLE_COUNTER_ASSET_NAME!,
      "0",
      txHash
    );
  } catch (e) {
    console.error(e);
  }
};

// JSON.stringify({
//   constructor: 0,
//   fields: [
//     {
//       bytes: stringToHex("aaa@github.com"),
//     },
//     { list: [
//       {
//         constructor: 0,
//         fields: [
//           {
//             "list": [
//               {
//                 "bytes": pubKeyHash
//               }
//             ]
//           },
//           {
//             "int": 10000
//           }
//         ]
//       }
//     ] },
//   ],
// }),
