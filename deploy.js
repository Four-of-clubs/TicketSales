const HDWalletProvider = require('@truffle/hdwallet-provider');
const Web3 = require('web3');
const { abi, bytecode } = require('./compile');

const provider = new HDWalletProvider(
  '',
  // remember to change this to your own phrase!
  ''
  // remember to change this to your own endpoint!
);
const web3 = new Web3(provider);

const deploy = async () => {
  const accounts = await web3.eth.getAccounts();

  console.log('Attempting to deploy from account', accounts[1]);

  TicketSales_instance = await new web3.eth.Contract(abi)
    .deploy({data: bytecode, arguments: [10, 15] })
    .send({from: accounts[1], gasPrice: 8000000000, gas: 4700000});

  console.log('Contract deployed to', TicketSales_instance.options.address);
  provider.engine.stop();
};

deploy();
