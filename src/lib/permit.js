import { ethers } from 'ethers';

const PERMIT_TYPES = {
  Permit: [
    { name: 'owner', type: 'address' },
    { name: 'spender', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
  ],
};

export async function buildPermitSignature(signer, token, spender, value, deadline) {
  const owner = await signer.getAddress();
  const [, name, version, chainId, verifyingContract] = await token.eip712Domain();
  const nonce = await token.nonces(owner);

  const domain = {
    name,
    version,
    chainId,
    verifyingContract,
  };

  const message = {
    owner,
    spender,
    value,
    nonce,
    deadline,
  };

  const signature = await signer.signTypedData(domain, PERMIT_TYPES, message);
  return ethers.Signature.from(signature);
}

export async function executePermit(signer, token, spender, value, deadline) {
  const sig = await buildPermitSignature(signer, token, spender, value, deadline);
  const owner = await signer.getAddress();
  return token.permit(owner, spender, value, deadline, sig.v, sig.r, sig.s);
}
