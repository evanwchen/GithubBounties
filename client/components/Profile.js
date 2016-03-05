const React = require('react');
const Router = require('react-router').Router;
const Route = require('react-router').Route;
const Link = require('react-router').Link;

class Profile extends React.Component {
  constructor (props) {
    super(props);

    this.state = {
      currentUser: null,
      prUrl: '',
      acceptedIssues: [
        {title: 'Some Mapped Dang',
        url: 'https://github.com/ProfoundMongoose/GithubBounties/pulls'
        },
        {title: 'Second Mapped Dang',
        url: 'https://github.com/ProfoundMongoose/GithubBounties/pulls/2'
        } // Suppose to be fetched from the server 
      ],
      issueState: undefined
    };
  }

  fetchAcceptedIssues() {
    $.get('fetchUserIssues', (data) => {
      if (data) {
        this.setState({
          acceptedIssues: data
        });
      }
    })
  }

  fetchUserInfo() {
    $.get( 'fetchUserInfo', ( data ) => {
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

  submitPull(url, index) { 
    $.post('submitPull', {bounty_url: url, username: this.state.currentUser.username, pr_url: this.state.issueState[index].text }, ( data ) => {
      console.log(data);
    });
  }

  toggleIssue(index){
    var obj = {};
    obj[index] = {visible: !this.state.issueState[index].visible, text: ''};
    this.setState({
      issueState: Object.assign(this.state.issueState, obj)
    })
  }

  handleChange(event, index){
    var obj = {};
    obj = this.state.issueState[index];
    obj.text = event.target.value;
    this.setState({
      issueState: Object.assign(this.state.issueState, obj)
    })
  }

  componentDidMount() {
    this.fetchUserInfo();
    this.fetchAcceptedIssues();
    var obj = {};
    this.state.acceptedIssues.forEach(function(issue, index){
      obj[index] = {state: false, text: ''};
    })
    this.setState({issueState: obj}) 
  }

  render() {
    var submitPull = this.submitPull.bind(this);
    var toggleIssue = this.toggleIssue.bind(this);
    var handleChange = this.handleChange.bind(this);
    var state = this.state;
    if(this.state.currentUser && this.state.issueState){
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
                this.state.acceptedIssues.map(function(issue, i){

                  return (
                    <div>
                      <h4> {issue.title} </h4>
                      {state.issueState[i].visible ? <input placeholder='Enter your PRs URL ' onChange={handleChange.bind(null, event, i)}/> : null }
                      {state.issueState[i].visible ? <button className='btn' onClick={submitPull.bind(null, issue.url, i)}>Submit </button>
                                                 : <button className='btn' onClick={toggleIssue.bind(null, i)}> Add PR URL </button> }
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