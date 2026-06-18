import { ethers } from 'ethers';
import { IB20_ABI } from './abis.js';
import { MAX_SUPPLY_CAP, POLICY_SCOPES, ROLES } from './constants.js';

const ib20Iface = new ethers.Interface(IB20_ABI);

const ASSET_PARAMS_TYPE =
  'tuple(uint8 version, string name, string symbol, address initialAdmin, uint8 decimals)';
const STABLECOIN_PARAMS_TYPE =
  'tuple(uint8 version, string name, string symbol, address initialAdmin, string currency)';

/** @see B20FactoryLib.encodeAssetCreateParams */
export function encodeAssetCreateParams(name, symbol, initialAdmin, decimals) {
  return ethers.AbiCoder.defaultAbiCoder().encode([ASSET_PARAMS_TYPE], [
    { version: 1, name, symbol, initialAdmin, decimals },
  ]);
}

/** @see B20FactoryLib.encodeStablecoinCreateParams */
export function encodeStablecoinCreateParams(name, symbol, initialAdmin, currency) {
  return ethers.AbiCoder.defaultAbiCoder().encode([STABLECOIN_PARAMS_TYPE], [
    { version: 1, name, symbol, initialAdmin, currency },
  ]);
}

export function encodeUpdateSupplyCap(newSupplyCap) {
  return ib20Iface.encodeFunctionData('updateSupplyCap', [newSupplyCap]);
}

export function encodeGrantRole(role, account) {
  return ib20Iface.encodeFunctionData('grantRole', [role, account]);
}

export function encodeUpdatePolicy(scopeName, policyId) {
  const scope = POLICY_SCOPES[scopeName];
  if (!scope) throw new Error(`Unknown policy scope: ${scopeName}`);
  return ib20Iface.encodeFunctionData('updatePolicy', [scope, policyId]);
}

export function buildRoleGrantInitCalls(roleMap) {
  const initCalls = [];
  for (const [roleName, account] of Object.entries(roleMap)) {
    if (!account || account === ethers.ZeroAddress) continue;
    const role = ROLES[roleName];
    if (!role) throw new Error(`Unknown role: ${roleName}`);
    initCalls.push(encodeGrantRole(role, account));
  }
  return initCalls;
}

export function parseSupplyCapInput(raw, decimals) {
  if (!raw || raw.trim() === '') return MAX_SUPPLY_CAP;
  return ethers.parseUnits(raw.trim(), decimals);
}

export function parseSalt(input) {
  const trimmed = input.trim();
  if (/^0x[0-9a-fA-F]{64}$/.test(trimmed)) {
    return trimmed;
  }
  return ethers.keccak256(ethers.toUtf8Bytes(trimmed));
}

export function parseAmount(raw, decimals) {
  return ethers.parseUnits(raw.trim(), decimals);
}

export function parseMemo(raw) {
  if (!raw || raw.trim() === '') return ethers.ZeroHash;
  const trimmed = raw.trim();
  if (/^0x[0-9a-fA-F]{64}$/.test(trimmed)) return trimmed;
  return ethers.encodeBytes32String(trimmed.slice(0, 31));
}
