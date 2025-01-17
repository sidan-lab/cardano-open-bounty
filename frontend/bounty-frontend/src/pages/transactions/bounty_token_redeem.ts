import { applyParamsToScript, OfflineEvaluator } from "@meshsdk/core-csl";
import blueprint from "../../../../../aiken-workspace/plutus.json";
import {
  BlockfrostProvider,
  IWallet,
  MeshTxBuilder,
  resolveScriptHash,
  stringToHex,
  serializePlutusScript,
  mTuple,
  // deserializeAddress,
  mConStr0,
  ByteString,
  mConStr1,
} from "@meshsdk/core";
import {
  getMultiSigTxApiRoute,
  getUtxoApiRoute,
  insertMultiSigApiRoute,
  insertRedeemMultiSigApiRoute,
} from "./api_common";
import { ApiMiddleware } from "@/middleware/api";
import { BountyDatum } from "../api/type";

export const burnBountyToken = async (
  bounty_name: string,
  issue_url: string,
  reward: number,
  all_signatories: string[],
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
  // const usedAddress = (await wallet.getUsedAddresses())[0];
  // const { pubKeyHash } = deserializeAddress(usedAddress);

  const bountyBoardScriptCbor = applyParamsToScript(
    blueprint.validators[1]!.compiledCode,
    [
      mTuple(
        process.env.NEXT_PUBLIC_ORACLE_NFT_POLICY_ID!,
        process.env.NEXT_PUBLIC_ORACLE_NFT_ASSET_NAME!
      ),
    ],
    "Mesh"
  );

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

  const bountyBoardScriptAddress = serializePlutusScript(
    {
      code: bountyBoardScriptCbor,
      version: "V3",
    },
    undefined,
    0
  ).address;

  const bountyMintingPolicyId = resolveScriptHash(
    bountyMintingScriptCbor,
    "V3"
  );
  const api = new ApiMiddleware(wallet);
  try {
    const idNftTxResult = await api.getIdNftTx();
    const idRefTxResult = await api.getIdRefTx();
    const idInfoResult = await api.getIdInfo(
      idRefTxResult.txHash,
      idRefTxResult.index
    );
    const oracleResult = await getUtxoApiRoute(
      process.env.NEXT_PUBLIC_ORACLE_NFT_ASSET_NAME!
    );
    const bountyResult = await getMultiSigTxApiRoute(bounty_name);

    const converted_all_signatories: ByteString[] = all_signatories.map(
      (item) => ({ bytes: item })
    );

    const bountyDatum: BountyDatum = {
      constructor: 0,
      fields: [
        {
          bytes: stringToHex(issue_url),
        },
        { int: reward },
        {
          list: converted_all_signatories,
        },
      ],
    };

    const unsignedTx = await txBuilder
      .readOnlyTxInReference(
        oracleResult.oracleTxHash,
        oracleResult.oracleOutputIndex
      )
      .txIn(idNftTxResult.txHash, idNftTxResult.index)
      .txIn(idRefTxResult.txHash, idRefTxResult.index)
      .txInScript()
      .txInInlineDatumPresent()
      .txIn(bountyResult.txHash, bountyResult.outputIndex)
      .txInRedeemerValue(mConStr1([]))
      .txInScript()
      .txInInlineDatumPresent()
      .mintPlutusScriptV3()
      .mint("-1", bountyMintingPolicyId, stringToHex(bounty_name))
      .mintingScript(bountyMintingScriptCbor)
      .mintRedeemerValue(mConStr1([]))
      .txOut(bountyBoardScriptAddress, [
        {
          unit: bountyMintingPolicyId + stringToHex(bounty_name),
          quantity: "1",
        },
      ])
      .txOutInlineDatumValue(bountyDatum, "JSON")
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

    await insertRedeemMultiSigApiRoute(
      bounty_name,
      signedTx,
      all_signatories,
      idInfoResult.gitHub
    );

    console.log(txHash);
  } catch (e) {
    console.error(e);
  }
};
