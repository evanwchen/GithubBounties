const React = require('react');

class BitCoinPaymentForm extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      address: '',
    };
  }

  handleSubmit(e) {
    e.preventDefault();
    var state = this.state;
    console.log('state', state);

    $.ajax({
      url: 'http://127.0.0.1:3000/payoutBitcoin',
      dataType: 'json',
      type: 'POST',
      data: {
        address: state.address,
      },
      success: function(data) {
        console.log('sent data!!!!', data);
      },
      error: function(xhr, status, err) {
        console.error('/payoutBitcoin', status, err.toString());
      }
    });

    // $.post( "http://127.0.0.1:3000/payoutBitcoin", { address: state.address }, 'json')
    //  .done(function( data ) {
    //    alert( "Data Loaded: " + data );
    //  });

  }

  handleBitCoinAddressChange(e) {
    this.setState({address: e.target.value});
  }

  render() {
    return (
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
  }
}

module.exports = BitCoinPaymentForm;
