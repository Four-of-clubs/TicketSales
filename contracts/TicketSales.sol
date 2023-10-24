// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

contract TicketSales {
    address public owner;
    uint public price;
    uint public numTickets;

    struct ticket {
        uint id;
        address owner;
        address swapAddress;
    }

    mapping(uint => ticket) public ticket_map;

    // SOME ADDITIONAL UTILITY FUNCTIONS ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    function sendEther(uint payment, address recipient) public payable returns (bool, bytes memory){
        bool success;
        bytes memory data;
        (success, data) = recipient.call{value: payment}("");
        return (success, data);
    }

    function createTickets() private {
        uint i;
        for (i=1; i<=numTickets; i++){
            ticket_map[i] = ticket(i, address(0), address(0));
        }
    }

    function isAvailable(uint ticketID) view private returns (bool){
        if (ticket_map[ticketID].owner == address(0)){
            return true;
        }
        return false;
    }

    function hasBoughtTicket(address buyer_address) view private returns (bool){
        uint i;
        for (i=1; i<=numTickets; i++){
            if (ticket_map[i].owner == buyer_address) return true;
        }
        return false;
    }
    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


    constructor(uint arg_numTickets, uint arg_price){
        owner = msg.sender;
        numTickets = arg_numTickets;
        price = arg_price;
        createTickets();
    }

    function buyTicket(uint ticketId) public payable{
        require(isAvailable(ticketId), "The ticket has already been purchased");
        require(!hasBoughtTicket(msg.sender), "This address has already bought a ticket");
        require(msg.value >= price, "Not enough Wei");
        ticket_map[ticketId].owner = msg.sender;
        sendEther(price, owner);
    }

    function getTicketOf(address person) view  public returns (uint){
        uint i;
        for (i=1; i<=numTickets; i++){
            if (ticket_map[i].owner == person) return i;
        }
        return 0;
    }

    function offerSwap(address partner) public {
        uint ticketID = getTicketOf(msg.sender);
        require(msg.sender != partner, "cannot swap with self");
        require(ticketID!=0, "Caller has no ticket");
        require(getTicketOf(partner)!=0, "Cannot swap with someone who owns no ticket");
        ticket_map[ticketID].swapAddress = partner;
    }

    function acceptSwap(address partner) public {
        uint ticketID_caller = getTicketOf(msg.sender);
        require(ticketID_caller!=0, "Caller has no ticket");
        uint ticketID_swaper = getTicketOf(partner);
        require(ticketID_caller!=0, "address given has no ticket");
        require(ticket_map[ticketID_swaper].swapAddress == msg.sender, "No offer to accept from given address");
        
        ticket_map[ticketID_caller].owner = partner;

        ticket_map[ticketID_swaper].owner = msg.sender;
        ticket_map[ticketID_swaper].swapAddress = address(0);
    }

    function returnTicket(uint ticketId) public payable{
        require(msg.sender == owner, "Only owner can return tickets");
        require(!isAvailable(ticketId), "the ticket has not yet been purchased");
        uint return_payment = price * 90 / 100; //solidity is weird about percentages
        require(msg.value >= return_payment, "Not enough Wei");
        sendEther(return_payment, ticket_map[ticketId].owner);
        ticket_map[ticketId].owner = address(0);
        ticket_map[ticketId].swapAddress = address(0);
    }
    
}
