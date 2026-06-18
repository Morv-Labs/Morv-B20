import chalk from 'chalk';
import { ethers } from 'ethers';
import { loadConfig, requireSigner } from '../lib/config.js';
import { getProvider, getSigner, getTokenContract } from '../lib/contracts.js';
import { parseAmount, parseMemo, parseSupplyCapInput } from '../lib/encoding.js';
import { POLICY_SCOPES, ROLES } from '../lib/constants.js';
import { executePermit } from '../lib/permit.js';
import { runTransaction } from '../lib/tx.js';
import { fail, linkTx } from '../lib/display.js';
import { decodeB20Address } from '../lib/address.js';
import { B20_VARIANT } from '../lib/constants.js';

async function ctx(requireKey = true) {
  const cfg = loadConfig();
  const network = requireKey ? requireSigner(cfg) : (await import('../lib/config.js')).requireRpc(cfg);
  const provider = getProvider(network.rpcUrl, network.chainId);
  const signer = cfg.privateKey ? getSigner(cfg.privateKey, provider) : null;
  return { cfg, network, provider, signer };
}

async function tokenAt(address, signerOrProvider) {
  return getTokenContract(address, signerOrProvider);
}

async function decimalsOf(token) {
  return token.decimals();
}

export async function opTransfer(tokenAddress, to, amountRaw, opts = {}) {
  const { network, signer } = await ctx();
  const token = await tokenAt(tokenAddress, signer);
  const amount = parseAmount(amountRaw, await decimalsOf(token));
  await runTransaction('Transfer sent', () => token.transfer(to, amount), network, opts);
}

export async function opTransferWithMemo(tokenAddress, to, amountRaw, memoRaw, opts = {}) {
  const { network, signer } = await ctx();
  const token = await tokenAt(tokenAddress, signer);
  const amount = parseAmount(amountRaw, await decimalsOf(token));
  const memo = parseMemo(memoRaw);
  await runTransaction('Transfer with memo sent', () => token.transferWithMemo(to, amount, memo), network, opts);
}

export async function opTransferFrom(tokenAddress, from, to, amountRaw, opts = {}) {
  const { network, signer } = await ctx();
  const token = await tokenAt(tokenAddress, signer);
  const amount = parseAmount(amountRaw, await decimalsOf(token));
  await runTransaction('transferFrom sent', () => token.transferFrom(from, to, amount), network, opts);
}

export async function opApprove(tokenAddress, spender, amountRaw, opts = {}) {
  const { network, signer } = await ctx();
  const token = await tokenAt(tokenAddress, signer);
  const amount = parseAmount(amountRaw, await decimalsOf(token));
  await runTransaction('Approve sent', () => token.approve(spender, amount), network, opts);
}

export async function opMint(tokenAddress, to, amountRaw, opts = {}) {
  const { network, signer } = await ctx();
  const token = await tokenAt(tokenAddress, signer);
  const amount = parseAmount(amountRaw, await decimalsOf(token));
  await runTransaction(`Minted ${amountRaw}`, () => token.mint(to, amount), network, opts);
}

export async function opMintWithMemo(tokenAddress, to, amountRaw, memoRaw, opts = {}) {
  const { network, signer } = await ctx();
  const token = await tokenAt(tokenAddress, signer);
  const amount = parseAmount(amountRaw, await decimalsOf(token));
  await runTransaction('Mint with memo', () => token.mintWithMemo(to, amount, parseMemo(memoRaw)), network, opts);
}

export async function opBurn(tokenAddress, amountRaw, opts = {}) {
  const { network, signer } = await ctx();
  const token = await tokenAt(tokenAddress, signer);
  const amount = parseAmount(amountRaw, await decimalsOf(token));
  await runTransaction('Burn complete', () => token.burn(amount), network, opts);
}

export async function opBurnWithMemo(tokenAddress, amountRaw, memoRaw, opts = {}) {
  const { network, signer } = await ctx();
  const token = await tokenAt(tokenAddress, signer);
  const amount = parseAmount(amountRaw, await decimalsOf(token));
  await runTransaction('Burn with memo', () => token.burnWithMemo(amount, parseMemo(memoRaw)), network, opts);
}

export async function opBurnBlocked(tokenAddress, from, amountRaw, opts = {}) {
  const { network, signer } = await ctx();
  const token = await tokenAt(tokenAddress, signer);
  const amount = parseAmount(amountRaw, await decimalsOf(token));
  await runTransaction('burnBlocked (freeze-seize)', () => token.burnBlocked(from, amount), network, opts);
}

export async function opPause(tokenAddress, features, opts = {}) {
  const { network, signer } = await ctx();
  const token = await tokenAt(tokenAddress, signer);
  await runTransaction('Paused', () => token.pause(features), network, opts);
}

export async function opUnpause(tokenAddress, features, opts = {}) {
  const { network, signer } = await ctx();
  const token = await tokenAt(tokenAddress, signer);
  await runTransaction('Unpaused', () => token.unpause(features), network, opts);
}

export async function opUpdateSupplyCap(tokenAddress, capRaw, opts = {}) {
  const { network, signer } = await ctx();
  const token = await tokenAt(tokenAddress, signer);
  const dec = await decimalsOf(token);
  const cap = parseSupplyCapInput(capRaw, dec);
  await runTransaction('Supply cap updated', () => token.updateSupplyCap(cap), network, opts);
}

export async function opUpdatePolicy(tokenAddress, scopeName, policyId, opts = {}) {
  const { network, signer } = await ctx();
  const scope = POLICY_SCOPES[scopeName];
  if (!scope) throw new Error(`Unknown scope: ${scopeName}`);
  const token = await tokenAt(tokenAddress, signer);
  await runTransaction('Policy attached', () => token.updatePolicy(scope, BigInt(policyId)), network, opts);
}

export async function opGrantRole(tokenAddress, roleName, account, opts = {}) {
  const { network, signer } = await ctx();
  const role = ROLES[roleName];
  if (!role) throw new Error(`Unknown role: ${roleName}`);
  const token = await tokenAt(tokenAddress, signer);
  await runTransaction(`${roleName} granted`, () => token.grantRole(role, account), network, opts);
}

export async function opRevokeRole(tokenAddress, roleName, account, opts = {}) {
  const { network, signer } = await ctx();
  const role = ROLES[roleName];
  if (!role) throw new Error(`Unknown role: ${roleName}`);
  const token = await tokenAt(tokenAddress, signer);
  await runTransaction(`${roleName} revoked`, () => token.revokeRole(role, account), network, opts);
}

export async function opRenounceLastAdmin(tokenAddress, opts = {}) {
  const { network, signer } = await ctx();
  const token = await tokenAt(tokenAddress, signer);
  await runTransaction('Last admin renounced — token now admin-less', () => token.renounceLastAdmin(), network, opts);
}

export async function opUpdateName(tokenAddress, newName, opts = {}) {
  const { network, signer } = await ctx();
  const token = await tokenAt(tokenAddress, signer);
  await runTransaction('Name updated', () => token.updateName(newName), network, opts);
}

export async function opUpdateSymbol(tokenAddress, newSymbol, opts = {}) {
  const { network, signer } = await ctx();
  const token = await tokenAt(tokenAddress, signer);
  await runTransaction('Symbol updated', () => token.updateSymbol(newSymbol), network, opts);
}

export async function opUpdateContractURI(tokenAddress, uri, opts = {}) {
  const { network, signer } = await ctx();
  const token = await tokenAt(tokenAddress, signer);
  await runTransaction('contractURI updated', () => token.updateContractURI(uri), network, opts);
}

export async function opPermit(tokenAddress, spender, amountRaw, deadlineSec, opts = {}) {
  const { network, signer } = await ctx();
  const token = await tokenAt(tokenAddress, signer);
  const amount = parseAmount(amountRaw, await decimalsOf(token));
  const deadline = BigInt(deadlineSec);
  await runTransaction('Permit submitted', () => executePermit(signer, token, spender, amount, deadline), network, opts);
}

export async function opBatchMint(tokenAddress, recipients, amountsRaw, opts = {}) {
  const { network, signer } = await ctx();
  const decoded = decodeB20Address(tokenAddress);
  if (decoded.variant !== B20_VARIANT.ASSET) {
    throw new Error('batchMint is Asset variant only');
  }
  const token = await tokenAt(tokenAddress, signer);
  const dec = await decimalsOf(token);
  const amounts = amountsRaw.map((a) => parseAmount(a, dec));
  await runTransaction('batchMint complete', () => token.batchMint(recipients, amounts), network, opts);
}

export async function opUpdateMultiplier(tokenAddress, multiplierWad, opts = {}) {
  const { network, signer } = await ctx();
  const decoded = decodeB20Address(tokenAddress);
  if (decoded.variant !== B20_VARIANT.ASSET) {
    throw new Error('updateMultiplier is Asset variant only');
  }
  const token = await tokenAt(tokenAddress, signer);
  const wad = ethers.parseEther(multiplierWad);
  await runTransaction('Multiplier updated', () => token.updateMultiplier(wad), network, opts);
}

export async function opUpdateExtraMetadata(tokenAddress, key, value, opts = {}) {
  const { network, signer } = await ctx();
  const token = await tokenAt(tokenAddress, signer);
  await runTransaction('Extra metadata updated', () => token.updateExtraMetadata(key, value), network, opts);
}

export async function opReadExtraMetadata(tokenAddress, key) {
  const { provider } = await ctx(false);
  const token = await tokenAt(tokenAddress, provider);
  const value = await token.extraMetadata(key);
  console.log(chalk.cyan(`\n${key} = ${value || '(empty)'}\n`));
}

export function handleOpError(err, hint) {
  fail(err.shortMessage || err.message || hint);
}
