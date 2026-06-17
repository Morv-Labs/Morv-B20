import chalk from 'chalk';
import Table from 'cli-table3';
import { banner } from '../lib/display.js';
import { decodeB20Address, predictSaltExcerpt } from '../lib/address.js';

export function runAddressDecode(tokenAddress) {
  banner();
  const decoded = decodeB20Address(tokenAddress);

  const table = new Table({ style: { head: ['cyan'] }, head: ['Field', 'Value'] });
  table.push(
    ['Address', decoded.address],
    ['B20 Prefix', decoded.isB20Prefix ? chalk.green(decoded.prefix) : chalk.yellow(decoded.prefix)],
    ['Variant', `${decoded.variantByte} → ${chalk.cyan(decoded.variantName)}`],
    ['Salt excerpt (bytes 11–19)', decoded.saltExcerpt],
  );

  console.log('\n' + table.toString());
  console.log(
    chalk.gray(
      '\nAddress layout: [0xB2 + 9 zero bytes][variant byte][keccak256(deployer,salt) first 9 bytes]\n',
    ),
  );
}

export { predictSaltExcerpt };
