#!/usr/bin/env node

import { Command } from 'commander';
import { runConfig } from '../src/commands/config.js';
import { runInspect } from '../src/commands/inspect.js';
import { runDeploy } from '../src/commands/deploy.js';
import { runBalance } from '../src/commands/balance.js';
import { runAddressDecode } from '../src/commands/address-decode.js';
import {
  runPolicyCreate,
  runPolicyCheck,
  runPolicyAdd,
  runPolicyAttach,
} from '../src/commands/policy.js';
import { runRoleGrant, runRoleCheck, runRoleRevoke } from '../src/commands/role.js';
import { runStatus } from '../src/commands/status.js';
import { runGuided } from '../src/commands/run.js';
import {
  opTransfer,
  opTransferWithMemo,
  opTransferFrom,
  opApprove,
  opMint,
  opMintWithMemo,
  opBurn,
  opBurnWithMemo,
  opBurnBlocked,
  opPause,
  opUnpause,
  opUpdateSupplyCap,
  opUpdateName,
  opUpdateSymbol,
  opUpdateContractURI,
  opPermit,
  opBatchMint,
  opUpdateMultiplier,
  opUpdateExtraMetadata,
  opReadExtraMetadata,
  opRenounceLastAdmin,
  handleOpError,
} from '../src/commands/token-ops.js';
import { banner } from '../src/lib/display.js';

const program = new Command();

program
  .name('b20')
  .description('morv-b20 — CLI for Base B20 Native Token Standard (Beryl upgrade)')
  .version('1.1.0');

program
  .command('run', { isDefault: true })
  .description('Guided session: config → status → actions → review (default)')
  .action(runGuided);

program.command('config').description('Configure RPC + private key').action(runConfig);
program.command('status').description('Check Beryl activation').action(runStatus);
program
  .command('inspect <tokenAddress>')
  .option('-a, --account <address>', 'Show roles for account')
  .action(runInspect);
program.command('deploy').description('Deploy Asset or Stablecoin').action(async () => {
  const result = await runDeploy();
  if (!result.ok) process.exitCode = 1;
});
program.command('balance <tokenAddress> <walletAddress>').action(runBalance);
program.command('address-decode <tokenAddress>').action(runAddressDecode);

const wrap = (fn) => async (...args) => {
  banner();
  try {
    await fn(...args);
  } catch (e) {
    handleOpError(e);
  }
};

program.command('transfer <token> <to> <amount>').action(wrap(opTransfer));
program.command('transfer-memo <token> <to> <amount> <memo>').action(wrap(opTransferWithMemo));
program.command('transfer-from <token> <from> <to> <amount>').action(wrap(opTransferFrom));
program.command('approve <token> <spender> <amount>').action(wrap(opApprove));
program.command('mint <token> <to> <amount>').action(wrap(opMint));
program.command('mint-memo <token> <to> <amount> <memo>').action(wrap(opMintWithMemo));
program.command('burn <token> <amount>').action(wrap(opBurn));
program.command('burn-memo <token> <amount> <memo>').action(wrap(opBurnWithMemo));
program.command('burn-blocked <token> <from> <amount>').action(wrap(opBurnBlocked));
program
  .command('pause <token> <features>')
  .description('Features: TRANSFER,MINT,BURN comma-separated')
  .action(wrap((token, features) => {
    const map = { TRANSFER: 0, MINT: 1, BURN: 2 };
    const list = features.split(',').map((f) => map[f.trim().toUpperCase()]);
    return opPause(token, list);
  }));
program
  .command('unpause <token> <features>')
  .action(wrap((token, features) => {
    const map = { TRANSFER: 0, MINT: 1, BURN: 2 };
    const list = features.split(',').map((f) => map[f.trim().toUpperCase()]);
    return opUnpause(token, list);
  }));
program.command('supply-cap <token> <cap>').description('Cap or empty for unlimited').action(wrap(opUpdateSupplyCap));
program.command('update-name <token> <name>').action(wrap(opUpdateName));
program.command('update-symbol <token> <symbol>').action(wrap(opUpdateSymbol));
program.command('update-contract-uri <token> <uri>').action(wrap(opUpdateContractURI));
program.command('renounce-admin <token>').action(wrap(opRenounceLastAdmin));
program
  .command('permit <token> <spender> <amount> <deadlineUnix>')
  .description('Sign EIP-2612 permit and submit')
  .action(wrap((token, spender, amount, deadline) => opPermit(token, spender, amount, Number(deadline))));
program
  .command('batch-mint <token> <pairs>')
  .description('addr:amount pairs comma-separated')
  .action(wrap(async (token, pairs) => {
    const { ethers } = await import('ethers');
    const recipients = [];
    const amounts = [];
    for (const part of pairs.split(',')) {
      const [addr, amt] = part.split(':');
      recipients.push(ethers.getAddress(addr.trim()));
      amounts.push(amt.trim());
    }
    return opBatchMint(token, recipients, amounts);
  }));
program.command('multiplier <token> <wad>').description('Asset only, e.g. 1.0').action(wrap(opUpdateMultiplier));
program.command('extra-metadata <token> <key> [value]').action(wrap(async (token, key, value) => {
  if (value === undefined) return opReadExtraMetadata(token, key);
  return opUpdateExtraMetadata(token, key, value);
}));

const policy = program.command('policy').description('PolicyRegistry');
policy.command('create').action(runPolicyCreate);
policy.command('check <policyId> <account>').action(runPolicyCheck);
policy.command('add <policyId> <accounts>').option('--allowlist').option('--remove').action(runPolicyAdd);
policy.command('attach <token> <scope> <policyId>').action(runPolicyAttach);

const role = program.command('role').description('AccessControl');
role.command('grant <token> <roleName> <account>').action(runRoleGrant);
role.command('revoke <token> <roleName> <account>').action(runRoleRevoke);
role.command('check <token> <roleName> <account>').action(runRoleCheck);

program.parse();
