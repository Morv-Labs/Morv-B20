import { ethers } from 'ethers';
import { B20_PREFIX, B20_VARIANT } from './constants.js';

export function decodeB20Address(tokenAddress) {
  const addr = tokenAddress.toLowerCase().replace(/^0x/, '');
  if (addr.length !== 40) {
    throw new Error('Invalid address length.');
  }

  const full = `0x${addr}`;
  const prefix = `0x${addr.slice(0, 20)}`;
  const variantByte = parseInt(addr.slice(20, 22), 16);
  const saltExcerpt = `0x${addr.slice(22)}`;

  let variantName;
  if (variantByte === B20_VARIANT.ASSET) variantName = 'ASSET';
  else if (variantByte === B20_VARIANT.STABLECOIN) variantName = 'STABLECOIN';
  else variantName = `UNKNOWN (${variantByte})`;

  const isB20Prefix = prefix === B20_PREFIX;

  return {
    address: full,
    prefix,
    isB20Prefix,
    variantByte,
    variantName,
    variant: variantByte,
    saltExcerpt,
  };
}

export function predictSaltExcerpt(deployer, salt) {
  const hash = ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(['address', 'bytes32'], [deployer, salt]),
  );
  return `0x${hash.slice(2, 20)}`;
}
