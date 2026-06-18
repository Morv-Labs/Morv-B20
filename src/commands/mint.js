import { banner, fail } from '../lib/display.js';
import { opMint, handleOpError } from './token-ops.js';

export async function runMint(tokenAddress, to, amountRaw) {
  banner();
  try {
    await opMint(tokenAddress, to, amountRaw);
  } catch (err) {
    handleOpError(err, 'Mint failed. Needs MINT_ROLE + MINT_RECEIVER_POLICY.');
  }
}
