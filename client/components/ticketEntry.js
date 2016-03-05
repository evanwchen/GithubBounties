const React = require('react');
const TimeAgo = require('../../node_modules/react-timeago/timeago');
const Link = require('react-router').Link;

class TicketEntry extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      bounty: this.props.bounty || false
    };
  }

  claimBounty() { 
    $.post('claimBounty', {url: this.props.data.html_url}, ( data ) => {
      console.log(data);
    });
  }

  render() {
    var bounty = this.state.bounty ? <h4> $ {this.props.data.bounty_price} </h4> : null;
    var button = this.state.bounty ? <a href='#' onClick={this.claimBounty.bind(this)} className='btn indigo accent-2'> Accept </a> : null;
    return (
      <div className="row">
        <div className="col s12 m10">
          <div className="card white">
            <div className="card-content black-text" >
              <span className="card-title activator"><a className="light-blue-text accent-1" href={this.props.data.html_url} target="_blank">{this.props.data.title}</a><i className="material-icons right">more_vert</i></span>
              <div className="row">
                <div className="col s12 m12">  
                  {this.state.bounty ? null : this.props.data.labels.map(function(label, index) {
                    return (
                      <div className="chip" style={{'backgroundColor': '#' + label.color}} key={index}>
                        {label.name}
                      </div>
                    );
                  }
                )
                }
                </div>
              </div>
              <div className="row">
                <p className="left-align col s6"><span className="octicon octicon-calendar"></span> created <TimeAgo date={this.props.data.created_at} /></p>
              </div>
              <div className="row">
                <p className="left-align col s4">repo: <Link className="cyan-text lighten-2" to={`/repoProfile/${this.props.data.repo_id}`}>{this.props.data.repo_name}
                </Link></p>
                <div className="col s6 offset-s3"> {bounty}{button}</div>
                <p className="right-align col s2">{this.props.data.language}</p>
              </div>
            </div>
          <div className="card-reveal">
            <span className="card-title grey-text text-darken-4">{this.props.data.title}<i className="material-icons right">close</i></span>
            <p>{this.props.data.body}</p>
          </div>
          </div>
        </div>
      </div>
    );
  }
}

module.exports = TicketEntry;

