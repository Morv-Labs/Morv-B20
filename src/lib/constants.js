import { ethers } from 'ethers';

/** @see base/base-std src/StdPrecompiles.sol */
export const PRECOMPILES = {
  B20_FACTORY: '0xB20f000000000000000000000000000000000000',
  POLICY_REGISTRY: '0x8453000000000000000000000000000000000002',
  ACTIVATION_REGISTRY: '0x8453000000000000000000000000000000000001',
};

/** @see base/base-std test/lib/mocks/ActivationRegistryFeatureList.sol */
export const FEATURES = {
  B20_ASSET: '0xcdcc772fe4cbdb1029f822861176d09e646db96723d4c1e82ddfdeb8163ef54c',
  B20_STABLECOIN: '0xecfa0def2c10020caaf65e6155aa69c84b24892aaef76eeac52e0e2b3a0b8601',
  POLICY_REGISTRY: '0xb582ebae03f16fee49a6763f78df482fb11ae73f103ed0d330bbe556aa90a43f',
};

/** @see base/base-std src/lib/B20Constants.sol */
export const B20_VARIANT = {
  ASSET: 0,
  STABLECOIN: 1,
};

export const B20_PREFIX = '0xb200000000000000000000';

export const MAX_SUPPLY_CAP = (2n ** 128n) - 1n;

export const ALWAYS_ALLOW = 0n;
export const ALWAYS_BLOCK = (1n << 56n) | 1n;

export const PAUSABLE_FEATURES = ['TRANSFER', 'MINT', 'BURN'];

/** @see B20Constants.sol */
export const ROLES = {
  DEFAULT_ADMIN_ROLE: ethers.ZeroHash,
  MINT_ROLE: ethers.id('MINT_ROLE'),
  BURN_ROLE: ethers.id('BURN_ROLE'),
  BURN_BLOCKED_ROLE: ethers.id('BURN_BLOCKED_ROLE'),
  PAUSE_ROLE: ethers.id('PAUSE_ROLE'),
  UNPAUSE_ROLE: ethers.id('UNPAUSE_ROLE'),
  METADATA_ROLE: ethers.id('METADATA_ROLE'),
  OPERATOR_ROLE: ethers.id('OPERATOR_ROLE'),
};

export const ROLE_NAMES = Object.fromEntries(
  Object.entries(ROLES).map(([name, hash]) => [hash, name]),
);

export const POLICY_SCOPES = {
  TRANSFER_SENDER_POLICY: ethers.id('TRANSFER_SENDER_POLICY'),
  TRANSFER_RECEIVER_POLICY: ethers.id('TRANSFER_RECEIVER_POLICY'),
  TRANSFER_EXECUTOR_POLICY: ethers.id('TRANSFER_EXECUTOR_POLICY'),
  MINT_RECEIVER_POLICY: ethers.id('MINT_RECEIVER_POLICY'),
};

export const SCOPE_NAMES = Object.fromEntries(
  Object.entries(POLICY_SCOPES).map(([name, hash]) => [hash, name]),
);

export const NETWORKS = {
  mainnet: {
    name: 'Base Mainnet',
    rpcUrl: 'https://mainnet.base.org',
    chainId: 8453,
  },
  sepolia: {
    name: 'Base Sepolia',
    rpcUrl: 'https://sepolia.base.org',
    chainId: 84532,
  },
};
