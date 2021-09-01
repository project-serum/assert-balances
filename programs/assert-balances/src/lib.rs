use anchor_lang::prelude::*;
use anchor_spl::token::{self, TokenAccount};

#[program]
pub mod assert_balances {
    use super::*;

    /// Asserts the balances are greater than or equal to the amounts given.
    ///
    /// This can be used as an additional safety check by wallets and other apps
    /// to ensure the outcome of a given transaction is as expected. If a
    /// transaction ends up changing balances more than expected, then it will
    /// abort.
    ///
    /// Each item in `expected_token_balances` corresponds with an account in
    /// `ctx.remaining_accounts`.
    pub fn assert(
        ctx: Context<AssertBalances>,
        expected_sol_balance: u64,
        expected_token_balances: Vec<u64>,
    ) -> Result<()> {
        let mut expected_token_balances = expected_token_balances;
        let mut accs = ctx.remaining_accounts;

        // There must be a token account for each balance given.
        if expected_token_balances.len() != accs.len() {
            return Err(ErrorCode::InvalidBalanceLen.into());
        }

        // Assert SOL balance.
        if **ctx.accounts.user.lamports.borrow() < expected_sol_balance {
            return Err(ErrorCode::InvalidSolBalance.into());
        }

        // Assert token balances.
        loop {
            // Have we iterated through all tokens?
            if accs.len() == 0 {
                return Ok(());
            }

            // Deserialize the token account.
            let token = CpiAccount::<TokenAccount>::try_accounts(ctx.program_id, &mut accs, &[])?;

            // Is it owned by the SPL token program.
            if token.to_account_info().owner != &token::ID {
                return Err(ErrorCode::InvalidOwner.into());
            }

            // Is it owned by the user?
            if &token.owner != ctx.accounts.user.key {
                return Err(ErrorCode::InvalidOwner.into());
            }

            // Is the post balance at least the amount expected?
            let balance = expected_token_balances.remove(0);
            if token.amount < balance {
                return Err(ErrorCode::InvalidTokenBalance.into());
            }
        }
    }
}

#[derive(Accounts)]
pub struct AssertBalances<'info> {
    #[account(signer)]
    user: AccountInfo<'info>,
}

#[error]
pub enum ErrorCode {
    #[msg("Owner doesn't match the SPL token program")]
    InvalidOwner,
    #[msg("Authority doesn't match the user")]
    InvalidAuthority,
    #[msg("Accounts length must match the given instruction balance length.")]
    InvalidBalanceLen,
    #[msg("Unexpected SOL balance")]
    InvalidSolBalance,
    #[msg("Unexpected token balance")]
    InvalidTokenBalance,
}
