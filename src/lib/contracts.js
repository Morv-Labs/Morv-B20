import { ethers } from 'ethers';
import {
  ACTIVATION_REGISTRY_ABI,
  IB20_ASSET_ABI,
  IB20_FACTORY_ABI,
  IB20_STABLECOIN_ABI,
  POLICY_REGISTRY_ABI,
} from './abis.js';
import { B20_VARIANT, PRECOMPILES } from './constants.js';
import { decodeB20Address } from './address.js';

export function getProvider(rpcUrl, chainId) {
  return new ethers.JsonRpcProvider(rpcUrl, chainId);
}

export function getSigner(privateKey, provider) {
  return new ethers.Wallet(privateKey, provider);
}

export function getFactory(signerOrProvider) {
  return new ethers.Contract(PRECOMPILES.B20_FACTORY, IB20_FACTORY_ABI, signerOrProvider);
}

export function getPolicyRegistry(signerOrProvider) {
  return new ethers.Contract(PRECOMPILES.POLICY_REGISTRY, POLICY_REGISTRY_ABI, signerOrProvider);
}

export function getActivationRegistry(provider) {
  return new ethers.Contract(PRECOMPILES.ACTIVATION_REGISTRY, ACTIVATION_REGISTRY_ABI, provider);
}

export function getTokenContract(tokenAddress, providerOrSigner) {
  const decoded = decodeB20Address(tokenAddress);
  const abi = decoded.variant === B20_VARIANT.STABLECOIN ? IB20_STABLECOIN_ABI : IB20_ASSET_ABI;
  return new ethers.Contract(tokenAddress, abi, providerOrSigner);
}

export function parseB20Created(receipt, factory) {
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== PRECOMPILES.B20_FACTORY.toLowerCase()) continue;
    try {
      const parsed = factory.interface.parseLog(log);
      if (parsed?.name === 'B20Created') {
        return parsed.args.token;
      }
    } catch {
      // skip unrelated logs
    }
  }
  return null;
}

export function parsePolicyCreated(receipt, registry) {
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== PRECOMPILES.POLICY_REGISTRY.toLowerCase()) continue;
    try {
      const parsed = registry.interface.parseLog(log);
      if (parsed?.name === 'PolicyCreated') {
        return parsed.args.newPolicyId ?? parsed.args.policyId;
      }
    } catch {
      // skip
    }
  }
  return null;
}
