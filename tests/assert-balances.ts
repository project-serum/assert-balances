import * as assert from 'assert';
import * as anchor from '@project-serum/anchor';
import { Token, TOKEN_PROGRAM_ID, Token as MintClient, Account as TokenAccount } from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';

describe('assert-balances', () => {

  anchor.setProvider(anchor.Provider.env());
  const program = anchor.workspace.AssertBalances;
	const mints: Array<MintAccounts> = [];
	let ctx;

  it('BOILERPLATE: Setup token accounts', async () => {
		// Iniitialize each mint and token for the test suite.
		for (let k = 0; k < 5; k += 1) {
			// Create mint.
			const client = await Token.createMint(
				program.provider.connection,
				program.provider.wallet.payer,
				program.provider.wallet.publicKey,
				null,
				6,
				TOKEN_PROGRAM_ID
			);

			// Create token account.
			const tokenAddress = await client.createAccount(program.provider.wallet.publicKey);

			// Mint to the account.
			await client.mintTo(
				tokenAddress,
				program.provider.wallet.payer,
				[],
				1000000,
			);

			// Get the account data.
			const tokenAccount = await client.getAccountInfo(tokenAddress);

			// Save the mints.
			mints.push({
				client,
				tokenAddress,
				tokenAccount,
			});
		}

		// Shared context for subsequent instructions.
		ctx = {
			accounts: {
				user: program.provider.wallet.publicKey,
			},
			remainingAccounts: mints.map(m => {
				return {
					pubkey: m.tokenAddress, isWritable: false, isSigner: false,
				};
			}),
		};
	});

	it('Succeeds when balances are equal', async () => {
		const solBalance = new BN('499999999982490600');
		const tokenBalances = mints.map(mint => mint.tokenAccount.amount);
		await program.rpc.assert(solBalance, tokenBalances, ctx);
	});

	it('Aborts balances when token accounts are not provided', async () => {
		const solBalance = new BN('499999999982490600');
		const tokenBalances = mints.map(mint => mint.tokenAccount.amount);
		await assert.rejects(
			async () => {
				await program.rpc.assert(solBalance, tokenBalances, {...ctx, remainingAccounts:[]});
			}, (err) => {
				// @ts-ignore
				assert.ok(err.code, 302);
				return true;
			},
		);
	});

	it('Fails to assert sol balance', async () => {
		const solBalance = new BN('499999999982490599');
		const tokenBalances = mints.map(mint => mint.tokenAccount.amount);
		await assert.rejects(
			async () => {
				await program.rpc.assert(solBalance, tokenBalances, ctx);
			}, (err) => {
				// @ts-ignore
				assert.ok(err.code, 303);
				return true;
			},
		);
	});

	it('Fails to assert token balance', async () => {
		const solBalance = new BN('399999999982490600');
		const tokenBalances = mints.map(mint => mint.tokenAccount.amount.addn(1));
		await assert.rejects(
			async () => {
				await program.rpc.assert(solBalance, tokenBalances, ctx);
			}, (err) => {
				// @ts-ignore
				assert.ok(err.code, 304);
				return true;
			},
		);
	});
});

type MintAccounts = {
	client: MintClient;
	tokenAddress: PublicKey;
	tokenAccount: TokenAccount;
};
