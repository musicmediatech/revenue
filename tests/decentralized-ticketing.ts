import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { DecentralizedTicketing } from "../target/types/decentralized_ticketing";
import { expect } from "chai";

describe("decentralized-ticketing", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.decentralizedTicketing as Program<DecentralizedTicketing>;
  const systemProgram = anchor.web3.SystemProgram.programId;
  const metadataProgramId = new anchor.web3.PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
  const provider = program.provider;

  async function requestAirdrop(pubkey: anchor.web3.PublicKey) {
    const sig = await provider.connection.requestAirdrop(pubkey, 2_000_000_000);
    await provider.connection.confirmTransaction(sig, "confirmed");
  }

  it("Is initialized!", async () => {
    const tx = await program.methods.initialize().rpc();
    console.log("Your transaction signature", tx);
  });

  it("Initializes an event", async () => {
    const eventAccount = anchor.web3.Keypair.generate();
    await requestAirdrop(provider.publicKey);

    await program.methods
      .initializeEvent("Concert", "Stadium", new anchor.BN(Date.now() / 1000))
      .accounts({
        eventAccount: eventAccount.publicKey,
        authority: provider.publicKey,
        systemProgram,
      })
      .signers([eventAccount])
      .rpc();

    const account = await program.account.eventAccount.fetch(eventAccount.publicKey);
    console.log("Event Account:", account);
    expect(account.name).to.equal("Concert");
    expect(account.venue).to.equal("Stadium");
  });

  it("Mints a ticket", async () => {
    const eventAccount = anchor.web3.Keypair.generate();
    const ticketAccount = anchor.web3.Keypair.generate();
    const metadataAccount = anchor.web3.Keypair.generate();
    const mintAccount = anchor.web3.Keypair.generate();
    const seat = "A1";
    const category = "VIP";

    await requestAirdrop(provider.publicKey);
    await requestAirdrop(mintAccount.publicKey);
    await requestAirdrop(eventAccount.publicKey);
    await requestAirdrop(ticketAccount.publicKey);
    await requestAirdrop(metadataAccount.publicKey);

    await program.methods
      .initializeEvent("Concert", "Stadium", new anchor.BN(Date.now() / 1000))
      .accounts({
        eventAccount: eventAccount.publicKey,
        authority: provider.publicKey,
        systemProgram,
      })
      .signers([eventAccount])
      .rpc();

    await program.methods
      .mintTicket(seat, category)
      .accounts({
        eventAccount: eventAccount.publicKey,
        ticketAccount: ticketAccount.publicKey,
        authority: provider.publicKey,
        systemProgram,
        metadata: metadataAccount.publicKey,
        mint: mintAccount.publicKey,
        metadataProgram: metadataProgramId,
      })
      .signers([eventAccount, ticketAccount, metadataAccount, mintAccount])
      .rpc();

    const ticket = await program.account.ticketAccount.fetch(ticketAccount.publicKey);
    expect(ticket.seat).to.equal(seat);
    expect(ticket.category).to.equal(category);
    expect(ticket.scanned).to.be.false;
  });

  it("Mints a ticket with metadata", async () => {
    const eventAccount = anchor.web3.Keypair.generate();
    const ticketAccount = anchor.web3.Keypair.generate();
    const metadataAccount = anchor.web3.Keypair.generate();
    const mintAccount = anchor.web3.Keypair.generate();
    const seat = "A1";
    const category = "VIP";

    await requestAirdrop(provider.publicKey);
    await requestAirdrop(mintAccount.publicKey);
    await requestAirdrop(eventAccount.publicKey);
    await requestAirdrop(ticketAccount.publicKey);
    await requestAirdrop(metadataAccount.publicKey);

    await program.methods
      .initializeEvent("Concert", "Stadium", new anchor.BN(Date.now() / 1000))
      .accounts({
        eventAccount: eventAccount.publicKey,
        authority: provider.publicKey,
        systemProgram,
      })
      .signers([eventAccount])
      .rpc();

    await program.methods
      .mintTicket(seat, category)
      .accounts({
        eventAccount: eventAccount.publicKey,
        ticketAccount: ticketAccount.publicKey,
        authority: provider.publicKey,
        systemProgram,
        metadata: metadataAccount.publicKey,
        mint: mintAccount.publicKey,
        metadataProgram: metadataProgramId,
      })
      .signers([eventAccount, ticketAccount, metadataAccount, mintAccount])
      .rpc();

    const ticket = await program.account.ticketAccount.fetch(ticketAccount.publicKey);
    expect(ticket.seat).to.equal(seat);
    expect(ticket.category).to.equal(category);
    expect(ticket.scanned).to.be.false;
  });

  it("Verifies a ticket", async () => {
    const eventAccount = anchor.web3.Keypair.generate();
    const ticketAccount = anchor.web3.Keypair.generate();
    const metadataAccount = anchor.web3.Keypair.generate();
    const mintAccount = anchor.web3.Keypair.generate();

    await requestAirdrop(provider.publicKey);
    await requestAirdrop(mintAccount.publicKey);
    await requestAirdrop(eventAccount.publicKey);
    await requestAirdrop(ticketAccount.publicKey);
    await requestAirdrop(metadataAccount.publicKey);

    await program.methods
      .initializeEvent("Concert", "Stadium", new anchor.BN(Date.now() / 1000))
      .accounts({
        eventAccount: eventAccount.publicKey,
        authority: provider.publicKey,
        systemProgram,
      })
      .signers([eventAccount])
      .rpc();

    await program.methods
      .mintTicket("A1", "VIP")
      .accounts({
        eventAccount: eventAccount.publicKey,
        ticketAccount: ticketAccount.publicKey,
        authority: provider.publicKey,
        systemProgram,
        metadata: metadataAccount.publicKey,
        mint: mintAccount.publicKey,
        metadataProgram: metadataProgramId,
      })
      .signers([eventAccount, ticketAccount, metadataAccount, mintAccount])
      .rpc();

    await program.methods
      .verifyTicket()
      .accounts({
        ticketAccount: ticketAccount.publicKey,
        authority: provider.publicKey,
      })
      .rpc();

    const ticket = await program.account.ticketAccount.fetch(ticketAccount.publicKey);
    expect(ticket.scanned).to.be.true;
  });

  it("Transfers a ticket", async () => {
    const eventAccount = anchor.web3.Keypair.generate();
    const ticketAccount = anchor.web3.Keypair.generate();
    const metadataAccount = anchor.web3.Keypair.generate();
    const mintAccount = anchor.web3.Keypair.generate();
    const newOwner = anchor.web3.Keypair.generate();

    await requestAirdrop(provider.publicKey);
    await requestAirdrop(mintAccount.publicKey);
    await requestAirdrop(eventAccount.publicKey);
    await requestAirdrop(ticketAccount.publicKey);
    await requestAirdrop(metadataAccount.publicKey);

    await program.methods
      .initializeEvent("Concert", "Stadium", new anchor.BN(Date.now() / 1000))
      .accounts({
        eventAccount: eventAccount.publicKey,
        authority: provider.publicKey,
        systemProgram,
      })
      .signers([eventAccount])
      .rpc();

    await program.methods
      .mintTicket("A1", "VIP")
      .accounts({
        eventAccount: eventAccount.publicKey,
        ticketAccount: ticketAccount.publicKey,
        authority: provider.publicKey,
        systemProgram,
        metadata: metadataAccount.publicKey,
        mint: mintAccount.publicKey,
        metadataProgram: metadataProgramId,
      })
      .signers([eventAccount, ticketAccount, metadataAccount, mintAccount])
      .rpc();

    await program.methods
      .transferTicket()
      .accounts({
        ticketAccount: ticketAccount.publicKey,
        authority: provider.publicKey,
        newOwner: newOwner.publicKey,
      })
      .rpc();

    const ticket = await program.account.ticketAccount.fetch(ticketAccount.publicKey);
    expect(ticket.event.toBase58()).to.equal(newOwner.publicKey.toBase58());
  });

  it("Closes an event", async () => {
    const eventAccount = anchor.web3.Keypair.generate();

    await requestAirdrop(provider.publicKey);
    await requestAirdrop(eventAccount.publicKey);

    await program.methods
      .initializeEvent("Concert", "Stadium", new anchor.BN(Date.now() / 1000))
      .accounts({
        eventAccount: eventAccount.publicKey,
        authority: provider.publicKey,
        systemProgram,
      })
      .signers([eventAccount])
      .rpc();

    await program.methods
      .closeEvent()
      .accounts({
        eventAccount: eventAccount.publicKey,
        authority: provider.publicKey,
      })
      .rpc();

    try {
      await program.account.eventAccount.fetch(eventAccount.publicKey);
    } catch (err) {
      expect(err.message).to.include("Account does not exist");
    }
  });
});