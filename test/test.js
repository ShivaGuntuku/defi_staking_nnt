const EVM_REVERT = 'VM Exception while processing transaction: revert'

const ether = n => {
  return new web3.utils.BN(
    web3.utils.toWei(n.toString(), 'ether')
  )
}

// Same as ether
const tokens = n => ether(n)

const wait = s => {
  const milliseconds = s * 1000
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

const sgToken = artifacts.require("SGToken");
const simpleStake = artifacts.require("SimpleStake");


require('chai')
  .use(require('chai-as-promised'))
  .should()

contract('SimpleStake', ([deployer, user]) => {
  let stake, token
  const interestPerSecond = 60 * 60 * 24 * 365.25 //(10% APY) for min. deposit (0.01 ETH)

  beforeEach(async () => {
    token = await sgToken.new()
    stake = await simpleStake.new(token.address)
  })

  describe('testing token contract...', () => {
    describe('success', () => {
      it('checking token name', async () => {
        expect(await token.name()).to.be.eq('SG Token')
      })

      it('checking token symbol', async () => {
        expect(await token.symbol()).to.be.eq('SGT')
      })

      it('checking token initial total supply', async () => {
        expect(Number(await token.totalSupply())).to.eq(0)
      })
    })
  })

  describe('testing deposit...', () => {
    let balance

    describe('success', () => {
      beforeEach(async () => {
        await stake.deposit({value: 10**16, from: user}) //0.01 ETH
      })

      it('balance should increase', async () => {
        expect(Number(await stake.depositBalanceof(user))).to.eq(10**16)
      })

      it('deposit time should > 0', async () => {
        expect(Number(await stake.depositStartFrom(user))).to.be.above(0)
      })

      it('deposit status should eq true', async () => {
        expect(await stake.isStaked(user)).to.eq(true)
      })
    })

    describe('failure', () => {
      it('depositing should be rejected', async () => {
        await stake.deposit({value: 10**15, from: user}).should.be.rejectedWith(EVM_REVERT) //to small amount
      })
    })
  })

  describe('testing withdraw...', () => {
    let balance

    describe('success', () => {

      beforeEach(async () => {
        await stake.deposit({value: 10**16, from: user}) //0.01 ETH

        await wait(2) //accruing interest

        balance = await web3.eth.getBalance(user)
        await stake.withdraw({from: user})
      })

      it('balances should decrease', async () => {
        expect(Number(await web3.eth.getBalance(stake.address))).to.eq(0)
        expect(Number(await stake.depositBalanceof(user))).to.eq(0)
      })

      it('user should receive ether back', async () => {
        expect(Number(await web3.eth.getBalance(user))).to.be.above(Number(balance))
      })

      it('user should receive proper amount of interest', async () => {
        //time synchronization problem make us check the 1-3s range for 2s deposit time
        balance = Number(await token.balanceOf(user))
        expect(balance).to.be.above(0)
        expect(balance%interestPerSecond).to.eq(0)
        expect(balance).to.be.below(interestPerSecond*4)
      })

      it('depositer data should be reseted', async () => {
        expect(Number(await stake.depositStartFrom(user))).to.eq(0)
        expect(Number(await stake.depositBalanceof(user))).to.eq(0)
        expect(await stake.isStaked(user)).to.eq(false)
      })
    })

    describe('failure', () => {
      it('withdrawing should be rejected', async () =>{
        await stake.deposit({value: 10**16, from: user}) //0.01 ETH
        await wait(2) //accruing interest
        await stake.withdraw({from: deployer}).should.be.rejectedWith(EVM_REVERT) //wrong user
      })
    })
  })
})