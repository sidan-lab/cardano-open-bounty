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
  CIP68_100,
} from "@meshsdk/core";
import {
  getMultiSigTxApiRoute,
  getUtxoApiRoute,
  insertRedeemMultiSigApiRoute,
} from "../pages/common/api_common";
import { ApiMiddleware } from "@/middleware/api";
import {
  getBountyBoardScriptCbor,
  getBountyMintingPolicyId,
  getBountyMintingScriptCbor,
  getIdMintingPolicyId,
  getIdSpendingScriptAddress,
  getIdSpendingScriptCbor,
} from "./common";

export const burnBountyToken = async (
  bounty_name: string,
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

  const idMintingPolicyId = getIdMintingPolicyId();
  const idSpendingScriptCbor = getIdSpendingScriptCbor();
  const idSpendingScriptAddress = getIdSpendingScriptAddress();

  const bountyBoardScriptCbor = getBountyBoardScriptCbor();
  const bountyMintingScriptCbor = getBountyMintingScriptCbor();
  const bountyMintingPolicyId = getBountyMintingPolicyId();

  const api = new ApiMiddleware(wallet);
  try {
    const idNftTxResult = await api.getIdNftTx();
    const idRefTxResult = await api.getIdRefTx();
    const idInfoResult = await api.getIdInfo();
    const ownerIdInfoResult = await api.getOwnerIdInfo(bounty_name);
    const oracleResult = await getUtxoApiRoute(
      process.env.NEXT_PUBLIC_ORACLE_NFT_ASSET_NAME!
    );
    const bountyResult = await getMultiSigTxApiRoute(bounty_name);

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
      .readOnlyTxInReference(
        ownerIdInfoResult.tx_hash,
        ownerIdInfoResult.outputIndex
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
          unit:
            idMintingPolicyId + CIP68_100(stringToHex(idNftTxResult.tokenName)),
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
      .requiredSignerHash(ownerIdInfoResult.pubKeyHash)
      .changeAddress(changeAddress)
      .selectUtxosFrom(utxos.slice(1))
      .complete();

    const signedTx = await wallet.signTx(unsignedTx, true);

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
