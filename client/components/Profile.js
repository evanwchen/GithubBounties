const React = require('react');
const Router = require('react-router').Router;
const Route = require('react-router').Route;
const Link = require('react-router').Link;

class Profile extends React.Component {
  constructor (props) {
    super(props);

    this.state = {
      amount: undefined,
      address: '',
      payout: false,
      issueToPay: undefined,
      currentUser: null,
      prUrl: '',
      claimedIssues: [],
      // issueState: undefined
    };
  }

  fetchAcceptedIssues() {
    $.get('http://107.170.222.135:3000/fetchUserIssues', (data) => {
      console.log('data: ', data);
      if (data) {
        this.setState({
          claimedIssues: data
        });
      }
    });
  }

  fetchUserInfo() {
    $.get( 'http://107.170.222.135:3000/fetchUserInfo', ( data ) => {
      console.log(data);
      if (data) {
        this.setState({
          currentUser: {
            loggedIn: true,
            displayName: data.displayName,
            username: data.username,
            avatar: data._json.avatar_url
          }
        });
      }
    });
  }

  claimBounty(url, index, amount) { 
    var user = this.state.currentUser.username;
    var parsedURL = url.split('/');
    console.log('parsedURLLLLLLL', parsedURL);

    var apiCall = "https://api.github.com/search/issues?q=user:" + parsedURL[3] + "+repo:" + parsedURL[4] + "+'" + parsedURL[6] + "'+in:body+" + "author:" + user + "+is:merged&sort=created&order=desc";
    console.log(apiCall);

    var setPayoutToTrue = function () {
      this.setState({payout: true});
      this.setState({issueToPay: index});
      this.setState({amount: amount});

    }.bind(this);

    $.ajax({
      url: apiCall,
      dataType: 'json',
      type: 'GET',  
      success: function(data) {
        console.log('github data............:', data);
        if(data['total_count']===1) {
          //send to payment form
          setPayoutToTrue();

          console.log('you can get paid');
        } else {
          //your PR has not been merged by the issue owner
          alert('you cannot get paid');
        }
      },
      error: function(xhr, status, err) {
        console.log('errorrrrrrrrr');
      }
    });

  }

  componentDidMount() {
    this.fetchUserInfo();
    this.fetchAcceptedIssues();
    var obj = {};
    this.state.claimedIssues.forEach(function(issue, index){
      obj[index] = {state: false, text: ''};
    })
  }

  handleSubmit(e) {
    e.preventDefault();
    var state = this.state;
    console.log('state', state);

    $.ajax({
      url: 'http://107.170.222.135:3000/payoutBitcoin',
      dataType: 'json',
      type: 'POST',
      data: {
        address: state.address,
        amount: state.amount,
      },
      success: function(data) {
        console.log('sent data!!!!', data);
      },
      error: function(xhr, status, err) {
        console.error('/payoutBitcoin', status, err.toString());
      }
    });

  }

  handleBitCoinAddressChange(e) {
    this.setState({address: e.target.value});
  }


  render() {
    var claimBounty = this.claimBounty.bind(this);
    var state = this.state;

    var bitcoinPaymentForm = (
      <div className="row">
        <form onSubmit={ this.handleSubmit.bind(this) } className="col s12" >
          <div className="row">
            <div className="input-field col s12">
              <span>BitCoin Address</span>
              <input id="email" name="email" placeholder="1NF9wZU4FuWQrVqtM74BDxJ2xfRRRKMKfW" required onChange={this.handleBitCoinAddressChange.bind(this)} />
            </div>
          </div>
          <button className="waves-effect waves-light btn" type="submit">Submit</button>
        </form>
      </div>
    );

    if (this.state.currentUser) {
    return (
      <div className="row">
        <div className="col s12 m12">
          <div id='profile' className="card white">
            <div className="card-content black-text" >
              <div className="row">
                <div className="col s12 m4 l6">
                  <img className="responsive-img" src={`${this.state.currentUser.avatar}`} /> 
                </div>
                <div className="col s12 m4 l6">
                  <div className="row">
                    <h3> {this.state.currentUser.displayName} </h3>
                  </div>
                  <div className="row">
                    <h4> Github handle: {this.state.currentUser.username} </h4>
                    <button className='btn'> <Link className='white-text' to={'/bankAccountForm'}>Bank Form</Link></button>
                    <button className='btn'> <Link className='white-text' to={'/bitcoinpaymentform'}>Bitcoin Form</Link></button>

                  </div>
                </div>
              </div>
              <h3> Open Bounties: </h3>
              {
                this.state.claimedIssues.map(function(issue, i){

                  return (
                    <div>
                      <h4> {issue.title} </h4>
                      <button className='btn' onClick={claimBounty.bind(null, issue.html_url, i, issue.bitcoin_amount)}>Claim Bounty </button>
                      {state.payout && state.issueToPay===i ? bitcoinPaymentForm : null}
                    </div>
                  )
                })
              }
            </div>
          </div>
        </div>
      </div>
    );
  } else {
    return <div> </div>
  }

  }
}

module.exports = Profile;