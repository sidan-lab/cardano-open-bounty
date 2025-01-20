import { applyParamsToScript, OfflineEvaluator } from "@meshsdk/core-csl";
import blueprint from "../../../../aiken-workspace/plutus.json";
import {
  BlockfrostProvider,
  IWallet,
  MeshTxBuilder,
  resolveScriptHash,
  stringToHex,
  serializePlutusScript,
  mTuple,
  mConStr1,
  deserializeAddress,
  ByteString,
} from "@meshsdk/core";
import {
  getMultiSigTxApiRoute,
  getUtxoApiRoute,
  insertRedeemMultiSigApiRoute,
} from "./api_common";
import { ApiMiddleware } from "@/middleware/api";
import { ContributerDatum, ContributionDatum } from "./types";
import { Contribution } from "@/services/type";

export const burnBountyToken = async (
  bounty_name: string,
  all_signatories: string[],
  reward: number,
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
  const idMintingPolicyId = resolveScriptHash(idMintingScriptCbor, "V3");

  const idSpendingScriptCbor = applyParamsToScript(
    blueprint.validators[7]!.compiledCode,
    [
      mTuple(
        process.env.NEXT_PUBLIC_ORACLE_NFT_POLICY_ID!,
        process.env.NEXT_PUBLIC_ORACLE_NFT_ASSET_NAME!
      ),
    ],
    "Mesh"
  );

  const idSpendingScriptAddress = serializePlutusScript(
    {
      code: idSpendingScriptCbor,
      version: "V3",
    },
    undefined,
    0
  ).address;

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

  const bountyMintingPolicyId = resolveScriptHash(
    bountyMintingScriptCbor,
    "V3"
  );
  const api = new ApiMiddleware(wallet);
  try {
    const idNftTxResult = await api.getIdNftTx();
    const idRefTokenResult = await api.getIdRefToken();
    const idRefTxResult = await api.getIdRefTx();
    const idInfoResult = await api.getIdInfo(
      idRefTxResult.txHash,
      idRefTxResult.index
    );
    const oracleResult = await getUtxoApiRoute(
      process.env.NEXT_PUBLIC_ORACLE_NFT_ASSET_NAME!
    );
    const bountyResult = await getMultiSigTxApiRoute(bounty_name);

    const pubKeyHashes: string[] = all_signatories.map(
      (item) => deserializeAddress(item).pubKeyHash
    );

    const contributions: Contribution[] = idInfoResult.contributions;
    contributions.push({ all_signatories: pubKeyHashes, reward: reward });

    const contributionDatums: ContributionDatum[] = [];
    contributions.forEach((item) => {
      const pubKeyHashesByteString: ByteString[] = item.all_signatories.map(
        (item) => ({ bytes: item })
      );
      const contributionDatum: ContributionDatum = {
        constructor: 0,
        fields: [
          {
            list: pubKeyHashesByteString,
          },
          {
            int: item.reward,
          },
        ],
      };
      contributionDatums.push(contributionDatum);
    });

    const contributerDatumn: ContributerDatum = {
      constructor: 0,
      fields: [
        {
          bytes: stringToHex(idInfoResult.gitHub),
        },
        {
          list: contributionDatums,
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
      .txInScript(idSpendingScriptCbor)
      .txInInlineDatumPresent()
      .txIn(bountyResult.txHash, bountyResult.outputIndex)
      .txInRedeemerValue(mConStr1([]))
      .txInScript(bountyBoardScriptCbor)
      .txInInlineDatumPresent()
      .mintPlutusScriptV3()
      .mint("-1", bountyMintingPolicyId, stringToHex(bounty_name))
      .mintingScript(bountyMintingScriptCbor)
      .mintRedeemerValue(mConStr1([]))
      .txOut(idSpendingScriptAddress, [
        {
          unit: idMintingPolicyId + stringToHex(idRefTokenResult.refAssetName),
          quantity: "1",
        },
      ])
      .txOutInlineDatumValue(contributerDatumn, "JSON")
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
