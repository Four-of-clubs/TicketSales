const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');

const web3 = new Web3(ganache.provider());
 
const {abi, bytecode} = require('../compile');

let accounts;
let TicketSales_instance;

describe("TicketSales deploys", () => {
    beforeEach(async() => {
        accounts = await web3.eth.getAccounts();

        TicketSales_instance = await new web3.eth.Contract(abi)
        .deploy({data: bytecode, arguments: [10, 15] })
        .send({from: accounts[0], gasPrice: 8000000000, gas: 4700000});

    });

    it("deploys", async () => {
        console.log(accounts);
        assert.ok(TicketSales_instance.options.address)

        const ownerAddress = await TicketSales_instance.methods.owner().call();
        assert.equal(ownerAddress, accounts[0]);
    });

    it("allows users to buy tickets", async () => {
        await TicketSales_instance.methods.buyTicket(1).send({
            from: accounts[1], 
            value: 15,
            gasPrice: 8000000000,
            gas: 4700000});
        const ticketOwner = await TicketSales_instance.methods.ticket_map(1).call();
        assert.equal(ticketOwner.owner, accounts[1], "ticket sold did not change to the new owner");
    })

    it("can see what ticket an address owns", async () => {
        //sell ticket 1 to accounts[1]
        await TicketSales_instance.methods.buyTicket(1).send({
            from: accounts[1], 
            value: 15,
            gasPrice: 8000000000,
            gas: 4700000});

        //see what ticket accounts[1] owns -- should be 1
        const ticketID1 = await TicketSales_instance.methods.getTicketOf(accounts[1]).call({
            from: accounts[0], 
            gasPrice: 8000000000,
            gas: 4700000});

        assert.equal(ticketID1, 1);

        //see what ticket accounts[2] owns -- should be 0 (indicating no ticket owned)
        const ticketID2 = await TicketSales_instance.methods.getTicketOf(accounts[2]).call({
            from: accounts[0], 
            gasPrice: 8000000000,
            gas: 4700000});

        assert.equal(ticketID2, 0);
    })

    it("allows swapping of tickets", async () => {
        //sell ticket 1 to accounts[1]
        await TicketSales_instance.methods.buyTicket(1).send({
            from: accounts[1], 
            value: 15,
            gasPrice: 8000000000,
            gas: 4700000});

        //sell ticket 2 to accounts[2]
        await TicketSales_instance.methods.buyTicket(2).send({
            from: accounts[2], 
            value: 15,
            gasPrice: 8000000000,
            gas: 4700000});

        let ticket1 = await TicketSales_instance.methods.ticket_map(1).call();
        let ticket2 = await TicketSales_instance.methods.ticket_map(2).call();
            
        assert.equal(ticket1.owner, accounts[1]);
        assert.equal(ticket2.owner, accounts[2]);

        assert.equal(ticket1.swapAddress, 0);
        assert.equal(ticket2.swapAddress, 0);

        //account 1 offers swap
        await TicketSales_instance.methods.offerSwap(accounts[2]).send({
            from: accounts[1], 
            gasPrice: 8000000000,
            gas: 4700000});

        ticket1 = await TicketSales_instance.methods.ticket_map(1).call();
        ticket2 = await TicketSales_instance.methods.ticket_map(2).call();
            
        assert.equal(ticket1.owner, accounts[1]);
        assert.equal(ticket2.owner, accounts[2]);

        assert.equal(ticket1.swapAddress, accounts[2]);
        assert.equal(ticket2.swapAddress, 0);

        //account 2 accepts swap
        await TicketSales_instance.methods.acceptSwap(accounts[1]).send({
            from: accounts[2], 
            gasPrice: 8000000000,
            gas: 4700000});

        ticket1 = await TicketSales_instance.methods.ticket_map(1).call();
        ticket2 = await TicketSales_instance.methods.ticket_map(2).call();
            
        assert.equal(ticket1.owner, accounts[2]);
        assert.equal(ticket2.owner, accounts[1]);

        assert.equal(ticket1.swapAddress, 0);
        assert.equal(ticket2.swapAddress, 0);
    })

    it("allows the owner to return tickets", async () => {
        //sell ticket 1 to accounts[1]
        await TicketSales_instance.methods.buyTicket(1).send({
            from: accounts[1], 
            value: 15,
            gasPrice: 8000000000,
            gas: 4700000});

        const initialBalance = BigInt(await web3.eth.getBalance(accounts[1]));

        await TicketSales_instance.methods.returnTicket(1).send({
            from: accounts[0], 
            value: 15,
            gasPrice: 8000000000,
            gas: 4700000});

        ticket1 = await TicketSales_instance.methods.ticket_map(1).call();
        const finalBalance = BigInt(await web3.eth.getBalance(accounts[1]));

        assert.equal(ticket1.owner, 0);
        assert.equal(finalBalance > initialBalance, true, "return did not return any funds to origional owner")

    })
})

/*
buyTicket
getTicketOf
offerSwap
acceptSwap
returnTicket
*/