use anchor_lang::prelude::*;
use anchor_lang::solana_program::pubkey::Pubkey;
use anchor_lang::solana_program::system_instruction;
use anchor_lang::solana_program::sysvar::{rent::Rent, Sysvar};

declare_id!("H9Lxy2UNuNz9SLKN37AWTAEqekV9WAD4wakcatWBzcBM");

#[program]
pub mod decentralized_ticketing {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }

    pub fn initialize_event(ctx: Context<InitializeEvent>, name: String, venue: String, time: i64) -> Result<()> {
        let event_account = &mut ctx.accounts.event_account;
        event_account.name = name;
        event_account.venue = venue;
        event_account.time = time;
        event_account.organizer = *ctx.accounts.authority.key;
        Ok(())
    }

    pub fn mint_ticket(ctx: Context<MintTicket>, seat: String, category: String) -> Result<()> {
        let ticket_account = &mut ctx.accounts.ticket_account;
        ticket_account.event = ctx.accounts.event_account.key();
        ticket_account.seat = seat.clone();
        ticket_account.category = category.clone();
        ticket_account.scanned = false;

        // Validate the `metadata` account
        require!(*ctx.accounts.metadata.owner == ctx.accounts.metadata_program.key(), CustomError::InvalidMetadataAccount);
        require!(ctx.accounts.metadata.data_is_empty(), CustomError::MetadataAccountNotEmpty);

        // Create metadata for the NFT
        let metadata_program_key = ctx.accounts.metadata_program.key();
        let mint_key = ctx.accounts.mint.key();
        let metadata_seeds = &[b"metadata", metadata_program_key.as_ref(), mint_key.as_ref()];
        let (metadata_key, _bump) = Pubkey::find_program_address(metadata_seeds, &metadata_program_key);

        let metadata_instruction = system_instruction::create_account(
            &ctx.accounts.authority.key(),
            &metadata_key,
            Rent::get()?.minimum_balance(82), // Adjust size as needed
            82, // Adjust size as needed
            &ctx.accounts.metadata_program.key(),
        );

        anchor_lang::solana_program::program::invoke(
            &metadata_instruction,
            &[ctx.accounts.authority.to_account_info(), ctx.accounts.metadata.to_account_info()],
        )?;

        Ok(())
    }

    pub fn verify_ticket(ctx: Context<VerifyTicket>) -> Result<()> {
        let ticket_account = &mut ctx.accounts.ticket_account;
        require!(ticket_account.scanned == false, CustomError::TicketAlreadyScanned);
        ticket_account.scanned = true;
        Ok(())
    }

    pub fn transfer_ticket(ctx: Context<TransferTicket>) -> Result<()> {
        let ticket_account = &mut ctx.accounts.ticket_account;
        ticket_account.event = ctx.accounts.new_owner.key();
        Ok(())
    }

    pub fn close_event(ctx: Context<CloseEvent>) -> Result<()> {
        msg!("Event closed: {:?}", ctx.accounts.event_account.key());
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}

#[account]
pub struct EventAccount {
    pub name: String, // Event name
    pub venue: String, // Venue name
    pub time: i64, // Event timestamp
    pub organizer: Pubkey, // Organizer's public key
}

#[account]
pub struct TicketAccount {
    pub event: Pubkey, // Associated event
    pub seat: String, // Seat information
    pub category: String, // Ticket category (e.g., VIP, General)
    pub scanned: bool, // Scanned flag
}

#[derive(Accounts)]
pub struct InitializeEvent<'info> {
    #[account(init, payer = authority, space = 8 + 32 + 32 + 8 + 32)]
    pub event_account: Account<'info, EventAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct MintTicket<'info> {
    #[account(mut)]
    pub event_account: Account<'info, EventAccount>,
    #[account(init, payer = authority, space = 8 + 32 + 32 + 32 + 1)]
    pub ticket_account: Account<'info, TicketAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
    /// CHECK: This is safe because we are only creating metadata
    pub metadata: AccountInfo<'info>,
    /// CHECK: This is safe because we are only creating metadata
    pub mint: AccountInfo<'info>,
    /// CHECK: This is safe because we are only creating metadata
    pub metadata_program: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct VerifyTicket<'info> {
    #[account(mut)]
    pub ticket_account: Account<'info, TicketAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct TransferTicket<'info> {
    #[account(mut)]
    pub ticket_account: Account<'info, TicketAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    /// CHECK: This is safe because we are only transferring ownership
    pub new_owner: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct CloseEvent<'info> {
    #[account(mut, close = authority)]
    pub event_account: Account<'info, EventAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
}

#[error_code]
pub enum CustomError {
    #[msg("Ticket has already been scanned.")]
    TicketAlreadyScanned,
    #[msg("Invalid metadata account.")]
    InvalidMetadataAccount,
    #[msg("Metadata account is not empty.")]
    MetadataAccountNotEmpty,
}
