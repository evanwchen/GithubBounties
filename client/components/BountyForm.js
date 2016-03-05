const React = require('react');
import { Navigation } from 'react-router'
class BountyForm extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      issueURL: undefined, //send org_name, repo_name, number. it is saved in bountyIssues schema
      bountyPrice: 0, //store in bountyAmount in bountyIssues scehema
      bountyDescribed: false,
      paymentMethod: '',
      card: {
        number: '',
        cvc: '',
        exp_month: '', //forget the camelCase linters on this one because this is how stripe wants it
        exp_year: '' //forget the camelCase linters on this one because this is how stripe wants it
      },
      bitCoinAddress: '', //generated with every new bounty form
      bitCoinAmount: '', //stored in database as Satoshis (bitcoin * 100mm)
      exchangeRateBTCUSD: '', //fetched below
      bitCoinReceived: false, //when true, form is submitted
      githubId: '', //fetched below
      receivedPayment: false // bitcoin has been submitted
    };
  }

  componentDidMount() {
    Stripe.setPublishableKey('pk_test_4SrTTNmWSmtYCG2BxAYseTE9'); // set your test public key

    this.serverRequest = $.get('fetchUserInfo', function (data) {
      this.setState({
        githubId: data.id
      });
    }.bind(this));

    this.serverRequest = $.get('http://127.0.0.1:3000/reqNewAddress', function (data) {
      console.log('new address...................', data);
      this.setState({
        bitCoinAddress: data
      });
    }.bind(this));

    this.serverRequest = $.getJSON('https://api.coindesk.com/v1/bpi/currentprice.json', function (data) {
      console.log('BTC USD exhange rate...................', data);
      this.setState({
        exchangeRateBTCUSD: data['bpi']['USD']['rate']
      });
    }.bind(this));

    setInterval(()=> {
      if (this.state.bitCoinAddress && this.state.bitCoinAmount > 0 && this.state.paymentMethod === 'BitCoin') {
        this.serverRequest = $.get('https://api.blockcypher.com/v1/btc/main/addrs/' + this.state.bitCoinAddress + '/balance', function (data) {
          console.log('address checkup...................', data);
          console.log('bitCount Amount they said they would pay', this.state.bitCoinAmount);
          console.log('bitCount Amount set to address (unconfirmed)', data['unconfirmed_balance']);
          if (this.state.bitCoinAmount < data['unconfirmed_balance']) {
            this.setState({bitCoinReceived: true});
            console.log('true');
          }
        }.bind(this));
      }
    }, 10000);

    console.log(this.state);
  }

  handleSubmit(e) {
    e.preventDefault();
    var githubId = this.state.githubId;
    var issueURL = this.state.issueURL;
    var parsedURL = issueURL.split('/');
    var bountyPrice = this.state.bountyPrice;
    console.log('issueURL', issueURL);
    console.log('parsedURL', parsedURL);

    Stripe.createToken(this.state.card, function (status, response) {
      console.log( status, response );
      var token = response.id;
      //send the token to the server so we can use it to make a customer object and store in our database
      $.ajax({
        url: 'http://127.0.0.1:3000/stripeCC',
        dataType: 'json',
        type: 'POST',
        data: {
          stripeToken: token,
          githubId: githubId,
          org_name: parsedURL[3],
          repo_name: parsedURL[4],
          number: parsedURL[6],
          bountyPrice: bountyPrice
        },
        success: function(data) {
          console.log('data:', data);
        },
        error: function(xhr, status, err) {
          console.error('/stripeCC', status, err.toString());
        }
      });

    });
  }

  handleCreditCardChange(e) {
    let card = this.state.card;
    card[e.target.name] = e.target.value;
    this.setState(card);
    console.log(this.state);
  }

  handleIssueURLChange(e) {
    this.setState({issueURL: e.target.value}); //TODO: validate field
    console.log(this.state);
  }

  handleBountyPriceChange(e) {
    // var regex = /^\d+(?:\.\d{0,2})$/; // TODO: validate field
    this.setState({bountyPrice: e.target.value});
    var bitCoinAmount = (this.state.bountyPrice / this.state.exchangeRateBTCUSD).toString().slice(0,10);
    this.setState({bitCoinAmount: bitCoinAmount});
    console.log(this.state);
  }

  onPaymentMethodChange(e) {
    this.setState({
      paymentMethod: e.currentTarget.id
    });
  }

  render() {
    if (this.state.receivedPayment) {
      setTimeout(function(){
        window.location = "http://127.0.0.1:3000/";
      }.bind(this), 1500)
    }

    console.log(this.state);

    if (this.state.issueURL) {
      var githubId = this.state.githubId;
      var issueURL = this.state.issueURL;
      var parsedURL = issueURL.split('/');
      var bitcoin = this.state.bitCoinAmount * 100000000;

      console.log('issueURL', issueURL);
      console.log('parsedURL', parsedURL);
      console.log('bitcoin in satoshis (multipled by a 100 million)', bitcoin);

      if (this.state.bitCoinReceived && this.state.receivedPayment === false) {
        this.setState({'receivedPayment': true});
        $.ajax({
          url: 'http://127.0.0.1:3000/bitcoin',
          dataType: 'json',
          type: 'POST',
          data: {
            bitcoin_amount: bitcoin, //stored in satoshis (multipled by a 100 million)
            org_name: parsedURL[3],
            repo_name: parsedURL[4],
            number: parsedURL[6],
            githubId: githubId
          },
          success: function(data) {
            alert('Your bounty has been submitted!');
          },
          error: function(xhr, status, err) {
            console.error('/bitcoin', status, err.toString());
          }
        });
      }
    }

    var creditCardForm = (
      <div>
        <p>Note: You will not be charged until you approve and merge a pull request from a bounty hunter.</p>
        <p>Github Bounties will never store your credit card information. </p>

        <div className="row">
          <div className="input-field col s12">
            <span>Card Number</span>
            <input maxLength="20" id="card_number" name="number" placeholder="XXXX XXXX XXXX XXXX" required onChange={this.handleCreditCardChange.bind(this)} />
          </div>
        </div>

        <div className="row">
          <div className="input-field col s12">
            <span>CVC</span>
            <input maxLength="4" id="cvc" name="cvc" placeholder="CVC" required onChange={this.handleCreditCardChange.bind(this)} />
          </div>
        </div>

        <div className="row">
          <div className="input-field col s6">
            <span>Expiration (MM)</span>
            <input maxLength="2" placeholder="MM" id="exp_month" name="exp_month" required onChange={this.handleCreditCardChange.bind(this)} />
          </div>
          <div className="input-field col s6">
            <span>Expiration (YYYY)</span>
            <input maxLength="4" placeholder="YYYY" id="exp_year" name="exp_year" required onChange={this.handleCreditCardChange.bind(this)} />
          </div>
        </div>
      </div>
    );

    var bitCoinForm = (
      <div>
        <img src={this.state.receivedPayment ? './blockchainConfirm.jpg' : 'https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=bitcoin:' + this.state.bitCoinAddress + '?amount=' + this.state.bitCoinAmount} />
        <span>Scan the QR code with your coinbase app. This will submit your bounty</span>
      </div>
    );

    var paymentMethod = (
      <div>
        <h4>Enter Payment Information</h4>
        <p>
          <input type="radio" id="Credit Card" checked={this.state.paymentMethod === 'Credit Card'} onChange={this.onPaymentMethodChange.bind(this)}/>
          <label htmlFor="Credit Card">Pay by Credit Card</label>
        </p>
        <p>
          <input type="radio" id="BitCoin" checked={this.state.paymentMethod === 'BitCoin'} onChange={this.onPaymentMethodChange.bind(this)}/>
          <label htmlFor="BitCoin">Pay by BitCoin</label>
        </p>
      </div>
    );

    return (
      <div className="row">
        <h3>Post a Bounty</h3>

        <form onSubmit={ this.handleSubmit.bind(this) } className="col s12" >
          <h4>Enter the Github URL of Your Issue</h4>
          <div className="row">
            <div className="input-field col s12">
              <span>Issue URL</span>
              <input name="Issue URL" placeholder="https://github.com/DapperArgentina/DapperArgentina/issues/55" required onChange={this.handleIssueURLChange.bind(this)} />
            </div>
          </div>

          <h4>Enter Your Price</h4>
          <div className="row">
            <div className="input-field col s12">
              <span>$ Amount</span>
              <input name="Price" type="number" min="0.01" step="0.01" placeholder="10.00" onChange={this.handleBountyPriceChange.bind(this)} />
            </div>
          </div>

          {this.state.issueURL && this.state.bountyPrice ? paymentMethod : null}
          {this.state.paymentMethod === 'Credit Card' ? creditCardForm : null}
          {this.state.paymentMethod === 'BitCoin' ? bitCoinForm : null}
          {this.state.paymentMethod === 'Credit Card' ? <button className="waves-effect waves-light btn" type="submit">Submit Bounty</button> : null}

        </form>

      </div>
    );
  }
}

module.exports = BountyForm;
