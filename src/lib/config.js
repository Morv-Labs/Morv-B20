import fs from 'fs';
import os from 'os';
import path from 'path';
import { NETWORKS } from './constants.js';

export const CONFIG_PATH = path.join(os.homedir(), '.morv-b20rc.json');

export function loadConfig() {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveConfig(cfg) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), { mode: 0o600 });
}

export function resolveNetwork(cfg) {
  const key = cfg.network || 'mainnet';
  const preset = NETWORKS[key];
  if (!preset) {
    throw new Error(`Unknown network "${key}". Use mainnet or sepolia.`);
  }
  return {
    ...preset,
    rpcUrl: cfg.rpcUrl || preset.rpcUrl,
    chainId: cfg.chainId || preset.chainId,
  };
}

export function requireRpc(cfg) {
  const network = resolveNetwork(cfg);
  if (!network.rpcUrl) {
    throw new Error('RPC not configured. Run `b20 config` first.');
  }
  return network;
}

export function requireSigner(cfg) {
  const network = requireRpc(cfg);
  if (!cfg.privateKey) {
    throw new Error('Private key not configured. Run `b20 config` first.');
  }
  return network;
}
