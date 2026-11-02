import { useCallback, useEffect, useState } from "react";
import { maxUint256 } from "viem";
import {
  useConnection,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { hnvwaAbi, erc20Abi, lendingPoolAbi } from "./abis";
import { contracts, fromWei, hfFromWad, isDeployed, toWei } from "./contracts";
import { formatHf, maxBorrowUsd } from "./risk";

const readOpts = (enabled) => ({ enabled, refetchInterval: 4000 });

export function useProtocolPosition() {
  const { address, isConnected } = useConnection();
  const enabled = Boolean(isConnected && address && isDeployed());
  const account = address ? [address] : undefined;

  const position = useReadContract({
    address: contracts.lendingPool,
    abi: lendingPoolAbi,
    functionName: "getPosition",
    args: account,
    query: readOpts(enabled),
  });
  const walletHnvwaRead = useReadContract({
    address: contracts.hnvwa,
    abi: hnvwaAbi,
    functionName: "balanceOf",
    args: account,
    query: readOpts(enabled),
  });
  const walletHnvUsdRead = useReadContract({
    address: contracts.hnvUsd,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: account,
    query: readOpts(enabled),
  });
  const hnvwaAllowanceRead = useReadContract({
    address: contracts.hnvwa,
    abi: erc20Abi,
    functionName: "allowance",
    args: address ? [address, contracts.lendingPool] : undefined,
    query: readOpts(enabled),
  });
  const ausdAllowanceRead = useReadContract({
    address: contracts.hnvUsd,
    abi: erc20Abi,
    functionName: "allowance",
    args: address ? [address, contracts.lendingPool] : undefined,
    query: readOpts(enabled),
  });
  const ltvRead = useReadContract({
    address: contracts.lendingPool,
    abi: lendingPoolAbi,
    functionName: "ltvBps",
    query: readOpts(enabled),
  });

  const coll = position.data?.[0] ?? 0n;
  const debt = position.data?.[1] ?? 0n;
  const hfWad = position.data?.[2] ?? 0n;
  const collateralUsd = fromWei(coll);
  const debtUsd = fromWei(debt);
  const hf = debt === 0n ? Number.POSITIVE_INFINITY : hfFromWad(hfWad);
  const ltvBps = Number(ltvRead.data ?? 7000n);

  const refetch = async () => {
    await Promise.all([
      position.refetch(),
      walletHnvwaRead.refetch(),
      walletHnvUsdRead.refetch(),
      hnvwaAllowanceRead.refetch(),
      ausdAllowanceRead.refetch(),
      ltvRead.refetch(),
    ]);
  };

  return {
    address,
    isConnected,
    deployed: isDeployed(),
    collateralUsd,
    debtUsd,
    healthFactor: hf,
    healthFactorLabel: formatHf(hf),
    walletHnvwaUsd: fromWei(walletHnvwaRead.data ?? 0n),
    walletHnvUsdBal: fromWei(walletHnvUsdRead.data ?? 0n),
    hnvwaAllowance: hnvwaAllowanceRead.data ?? 0n,
    hnvUsdAllowance: ausdAllowanceRead.data ?? 0n,
    ltvBps,
    maxBorrow: maxBorrowUsd(collateralUsd, ltvBps),
    refetch,
  };
}

export function useProtocolActions(onDone) {
  const write = useWriteContract();
  const [hash, setHash] = useState();
  const [lastHash, setLastHash] = useState();
  const [pendingLabel, setPendingLabel] = useState(null);
  const [error, setError] = useState(null);
  const receipt = useWaitForTransactionReceipt({
    hash,
    query: { enabled: Boolean(hash) },
  });

  useEffect(() => {
    if (!receipt.isSuccess || !hash) return;
    setLastHash(hash);
    onDone?.();
    setHash(undefined);
  }, [receipt.isSuccess, hash, onDone]);

  useEffect(() => {
    if (!receipt.isError) return;
    setError(receipt.error?.message?.slice(0, 220) || "The transaction failed.");
    setHash(undefined);
  }, [receipt.isError, receipt.error]);

  const run = useCallback(
    async (label, args) => {
      setError(null);
      setPendingLabel(label);
      try {
        const tx = await write.mutateAsync(args);
        setHash(tx);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message.slice(0, 220));
      } finally {
        setPendingLabel(null);
      }
    },
    [write],
  );

  return {
    pendingLabel,
    confirming: receipt.isLoading,
    error,
    lastHash,
    busy: Boolean(pendingLabel) || receipt.isLoading,
    faucet: (amount = 10000) =>
      run("Requesting HNVWA", {
        address: contracts.hnvwa,
        abi: hnvwaAbi,
        functionName: "faucet",
        args: [toWei(amount)],
      }),
    approveHnvwa: () =>
      run("Approving HNVWA", {
        address: contracts.hnvwa,
        abi: erc20Abi,
        functionName: "approve",
        args: [contracts.lendingPool, maxUint256],
      }),
    approveHnvUsd: () =>
      run("Approving hnvUSD", {
        address: contracts.hnvUsd,
        abi: erc20Abi,
        functionName: "approve",
        args: [contracts.lendingPool, maxUint256],
      }),
    deposit: (amount) =>
      run("Depositing collateral", {
        address: contracts.lendingPool,
        abi: lendingPoolAbi,
        functionName: "depositCollateral",
        args: [toWei(amount)],
      }),
    borrow: (amount) =>
      run("Drawing hnvUSD", {
        address: contracts.lendingPool,
        abi: lendingPoolAbi,
        functionName: "borrow",
        args: [toWei(amount)],
      }),
    repay: (amount) =>
      run("Repaying", {
        address: contracts.lendingPool,
        abi: lendingPoolAbi,
        functionName: "repay",
        args: [toWei(amount)],
      }),
    withdraw: (amount) =>
      run("Withdrawing collateral", {
        address: contracts.lendingPool,
        abi: lendingPoolAbi,
        functionName: "withdrawCollateral",
        args: [toWei(amount)],
      }),
  };
}
