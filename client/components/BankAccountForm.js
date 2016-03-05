const React = require('react');

class BankAccountForm extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      email: '',
      bankAccount: {
        country: '',
        currency: '',
        routing_number: '', //forget the camelCase linters on this one because this is how stripe wants it
        account_number: '', //forget the camelCase linters on this one because this is how stripe wants it
        name: '', //forget the camelCase linters on this one because this is how stripe wants it
        account_holder_type: '' //forget the camelCase linters on this one because this is how stripe wants it
      },
      githubId: ''
    };
  }

  componentDidMount() {
    Stripe.setPublishableKey('pk_test_4SrTTNmWSmtYCG2BxAYseTE9'); // set your test public key

    this.serverRequest = $.get('fetchUserInfo', function (data) {
      this.setState({
        githubId: data.id
      });
    }.bind(this));
  }

  handleSubmit(e) {
    e.preventDefault();
    var state = this.state;
    console.log(state);
    Stripe.bankAccount.createToken(this.state.bankAccount, function (status, response) {
      console.log( status, response );
      //send the token to the server so we can attach it to a customer object and store in our database
      $.ajax({
        url: 'http://127.0.0.1:3000/stripeB',
        dataType: 'json',
        type: 'POST',
        data: {
          name: state.bankAccount.name,
          type: state.bankAccount.account_holder_type,
          bank_account: response.id,
          email: state.email,
          githubId: state.githubId
        },
        success: function(data) {
          console.log(data);
        },
        error: function(xhr, status, err) {
          console.error('/stripeB', status, err.toString());
        }
      });

    });
  }

  handleBankAccountChange(e) {
    let bankAccount = this.state.bankAccount;
    bankAccount[e.target.name] = e.target.value;
    this.setState(bankAccount);
  }

  handleEmailChange(e) {
    this.setState({email: e.target.value});
  }

  render() {
    return (
      <div className="row">
        <p>Github Bounties will never store your bank account information. </p>
        
        <form onSubmit={ this.handleSubmit.bind(this) } className="col s12" >


          <div className="row">
            <div className="input-field col s6">
              <span>Name</span>
              <input placeholder="John Doe" id="name" name="name" required onChange={this.handleBankAccountChange.bind(this)} />
            </div>
            <div className="input-field col s6">
              <span>Account Holder Type</span>
              <input placeholder="individual / company" id="account_holder_type" name="account_holder_type" required onChange={this.handleBankAccountChange.bind(this)} />
            </div>
          </div>

          <div className="row">
            <div className="input-field col s6">
              <span>Routing Number</span>
              <input maxLength="9" placeholder="111000025" id="routing_number" name="routing_number" required onChange={this.handleBankAccountChange.bind(this)} />
            </div>
            <div className="input-field col s6">
              <span>Account Number</span>
              <input maxLength="12" placeholder="000123456789" id="account_number" name="account_number" required onChange={this.handleBankAccountChange.bind(this)} />
            </div>
          </div>

          <div className="row">
            <div className="input-field col s6">
              <span>Currency</span>
              <input maxLength="3" placeholder="USD" id="currency" name="currency" required onChange={this.handleBankAccountChange.bind(this)} />
            </div>
            <div className="input-field col s6">
              <span>Country</span>
              <input maxLength="2" placeholder="US" id="country" name="country" required onChange={this.handleBankAccountChange.bind(this)} />
            </div>
          </div>

          <div className="row">
            <div className="input-field col s12">
              <span>Email</span>
              <input id="email" name="email" placeholder="johndoe@gmail.com" required onChange={this.handleEmailChange.bind(this)} />
            </div>
          </div>

          <button className="waves-effect waves-light btn" type="submit">Submit</button>
        </form>

      </div>

    );
  }
}

module.exports = BankAccountForm;
