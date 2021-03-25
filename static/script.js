class ReplyRow extends React.Component{
  constructor(props) {
    super(props);
    this.checkImage = this.checkImage.bind(this)
  }

    checkImage(message){
      console.log('checking image for message row')
      var words = message.split(" ");
      var imgRegex =  /(http(s?):)*\.(?:apng|avif|gif|jpg|jpeg|jfif|pjpeg|pjp|png|svg|webp)/
      var img = '';

      words.forEach(function(element) {
        if (imgRegex.test(element)){
          img = element
        }
      })
      return(
        <div>
        <p id='message-text'> {message} </p>
        <img id='image-text' src ={img}></img>
        </div>
      )
    }


  render(){
    const message = this.props.message;
    const user = this.props.user;
    return (
      <div id='reply-row'>
        <p id='message-user'>{user} </p>
        <div id='message-text'>{this.checkImage(message)} </div>
      </div>
    )
  }

}

class Thread extends React.Component{
  constructor(props) {
    super(props);
    this.fetchReplies = this.fetchReplies.bind(this)

    this.state={
      replies: []
    }}

  reply() {
    const body = document.getElementById("reply_body").value;
    const session_token = window.localStorage.getItem("journal_session_token");
    const channelID = this.props.channelID
    const user = this.props.display
    const userID = this.props.userID
    const postID = this.props.postID;
    const token = window.localStorage.getItem("session_token")

    fetch("/api/reply-thread", {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({channel: channelID, user: user, message:body, postID:postID, userID: userID, token:token})
    }).then((response) => {
      if(response.status == 200) {
        console.log('session token good & reply successfully posted!')
        document.getElementById('reply_body').value = '';
      } else if (response.status==500){
        alert('session token incorrect!')
      }else {
        console.log(response.status);
      }
    }).catch((response) =>{
      console.log(response);
    });}

  fetchReplies(){
    console.log('fetch replies')
    const postID = this.props.postID;
    const channelID = this.props.channelID;
    const userID = this.props.userID
    const token = window.localStorage.getItem("session_token")

    const messages = []

    fetch("/api/fetch-replies", {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({channel: channelID, post:postID, user:userID, token:token})
    }).then((response) => {
      if(response.status == 200) {
        response.json().then((data) => {
          this.setState({replies: data})
          console.log('replies successfully fetched!')
        //this.setState({messages: data})
      })} else if(response.status == 500){
        alert('session token incorrect!')
      }
      else {
        console.log(response.status);
      }
    }).catch((response) =>{
      console.log(response);
    });
  }

  componentDidMount() {
    //document.getElementById('loading').style.display = 'none';
    this.fetchReplies();
    //this.setState({done:true})
    this.timer = setInterval(() => this.fetchReplies(), 1000)
  }

  componentWillUnmount(){
    clearInterval(this.timer);
    this.timer = null;
    //this.setState({done:false})
  }

  render(){
    console.log('RENDERING THREAD')
    const message=this.props.message;
    const user = this.props.user;
    const postID = this.props.postID;
    const channelID = this.props.channelID
    const filled = []
    const rows = this.state.replies
    const channelName = window.localStorage.getItem("channelNameInThread")

    Object.keys(rows).forEach((key) => {
      filled.push(
        <ReplyRow key={key}
          message={rows[key][1]}
          user={rows[key][0]}/>)})

    return(
    <div className='thread-container'>
      <div id='message-list2'>
        <h2 id='channel-name-thread'>Thread for Channel {channelName}! </h2> <button id='close-thread' onClick={this.props.close}>X</button>
        <p id='message-user'> {user} </p>
        <p id='message-text'>{message} </p>
      </div>
      <div id='line'></div>

      <div id='message-list'>{filled} </div>

      <div className="reply" id="reply">
        <div className="post_form">
          <textarea id="reply_body"></textarea>
          <button className="form_button"  onClick={() => this.reply()}>
            Reply to Thread
          </button>
        </div>
      </div>
    </div>
  )
  }
}

class MessageRow extends React.Component{

  constructor(props) {
    super(props);
    this.isMountedVal = 0;
    this.getReplies = this.getReplies.bind(this)
    this.checkImage = this.checkImage.bind(this)
    this.state={
        numReplies:0,
        imageURL: ''
      }
    }

  getReplies(post_id){
    const channelInThread = this.props.channelInThread
    const userID = this.props.userID;
    const token = window.localStorage.getItem("session_token")

    fetch("/api/get-replies", {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({post: post_id, user:userID, token:token})
    }).then((response) => {
      if(response.status == 200) {
        response.json().then((data) => {
          console.log('session_token is good!')
          if (this.isMountedVal == 1){
            this.setState({numReplies: data['replies']})
          }
          //console.log('number of replies successfully fetched!', data)
        //this.setState({messages: data})
      })} else if (response.status==500){
        alert('session token incorrect')
      }
      else {
        console.log(response.status);
      }
    }).catch((response) =>{
      console.log(response);
    });
  }

  checkImage(message){
    var words = message.split(" ");
    var imgRegex =  /(http(s?):)*\.(?:apng|avif|gif|jpg|jpeg|jfif|pjpeg|pjp|png|svg|webp)/
    var img = '';

    words.forEach(function(element) {
      if (imgRegex.test(element)){
        img = element
      }
    })

    if (img != ''){
      return(
        <div>
        <p id='message-text'> {message} </p>
        <img id='image-text' src ={img}></img>
        </div>
      )
    } else{
      return(
        <div>
        <p id='message-text'> {message} </p>
        </div>
      )
    }

  }

  componentDidMount() {
    this.isMountedVal = 1;
    const post_id = this.props.post_id;
    //this.getReplies(post_id);
    this.timer = setInterval(() => this.getReplies(post_id), 1000)
  }

  componentWillUnmount(){
    this.isMountedVal = 0;
    clearInterval(this.timer);
    this.timer = null;
  }

  render() {
    const user = this.props.user;
    const message = this.props.message;
    const post_id = this.props.post_id;
    const num = this.state.numReplies
    const channelID = this.props.channelID
    const channelName = this.props.name

    return (
      <div id='message-row'>
        <p id='message-user'>{user} </p>
        <div id='message-text'>{this.checkImage(message)} </div>
        <p id='thread'> <button id='view-thread' onClick={()=> this.props.getThread(post_id, message, user, channelID, channelName)}>{num} replies - View Thread</button> </p>
      </div>
    );
  }
}

class Compose extends React.Component {
  post(id) {
    const body = document.getElementById("compose_body").value;
    const token = window.localStorage.getItem("session_token");
    const channelID = this.props.channel
    const user = this.props.user
    const display = this.props.display

    fetch("/api/post-message", {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({channel: channelID, user: display, message:body, userID:user, token:token})
    }).then((response) => {
      if(response.status == 200) {
        console.log('posted & session token is good!')
        document.getElementById('compose_body').value = '';
        this.props.showMessages(this.props.channelName, this.props.channel)
        this.props.fetchMessages();
      } else if (response.status == 500){
        alert('session token incorrect!')
      }else {
        console.log(response.status);
      }
    }).catch((response) =>{
      console.log(response);
    });}


  render() {
    return (
      <div className="compose" id="compose">
        <div className="post_form">
          <textarea id="compose_body"></textarea>
          <button className="form_button"  onClick={() => this.post()}>
            Post
          </button>
        </div>
      </div>
    );
  }
}

class MessageList extends React.Component{

  constructor(props) {
    super(props);
    this.fetchMessages = this.fetchMessages.bind(this)
    this.getThread = this.getThread.bind(this)
    this.closeThread = this.closeThread.bind(this)
    this.state={
      messages: [],
      channelID: '',
      postID:'',
      postInThread: '',
      channelInThread: 'not assigned yet',
      user:'',
      first:0
    }}

  getThread(post_id, message, user, channel, name){
    this.setState({postID: post_id});
    this.setState({postInThread: message});
    this.setState({user: user})
    console.log(channel, 'checking channel in thread')
    this.setState({channelInThread: channel})
    window.localStorage.setItem("channelNameInThread", name)
    history.pushState(null, null, `http://${window.location.hostname}:5000/thread?postID=${post_id}&channelname=${name}&channelID=${channel}`);
  }

  fetchMessages(){
    console.log('fetching messages')
    const name = this.props.name
    const id = this.props.id
    this.setState({channelID: id})
    const inPost = this.state.postID
    const channel = this.state.channelInThread;
    const user = this.props.user_id;
    const token = window.localStorage.getItem("session_token")

    fetch("/api/get-messages", {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({channel: id, user:user, token:token})
    }).then((response) => {
      if(response.status == 200) {
        console.log('session token good!')
        response.json().then((data) => {
          this.setState({messages: data})
          console.log('message successfully fetched!')

      })} else if (response.status == 500){
        alert('session token incorrect!')
      }
      else {
        console.log(response.status);
      }
    }).catch((response) =>{
      console.log(response);
    });
  }

  closeThread(){
    this.setState({postID: ''});
    history.pushState(null, null, `http://${window.location.hostname}:5000/channel?id=${this.props.id}&name=${this.props.name}`)
  }

  componentDidMount() {
    //document.getElementById('loading').style.display = 'none';
    console.log("MOUNTING MESSAGE LIST")
    this.fetchMessages();
    this.props.showMessages(this.props.name, this.props.id)
    //this.setState({done:true})
    //this.timer = setInterval(() => this.fetchMessages(), 5000)
  }

  componentWillUnmount(){
    console.log("UNMOUNTING MESSAGE LIST")
    clearInterval(this.timer);
    this.timer = null;
    //this.setState({done:false})
  }

  render(){
    const name = this.props.name
    const userID = this.props.user_id
    const id = this.props.id
    const channelsInfo = this.props.channelsInfo
    let unread = 0;
    if (channelsInfo){
      unread = channelsInfo[id][2]
    }
    console.log('RENDERING MESSAGE LIST', unread)
    const display = this.props.display
    const inPost = this.state.postID
    const stored = window.localStorage.getItem("channel")

    //Check if user has changed channels by pressing on the enter channel button
    if (stored){
      if (stored!=name){
        this.fetchMessages();
      }
    }
    window.localStorage.setItem("channel", name)

    if (window.location.pathname=='/thread'){
      if (this.state.postID == ''){
        console.log("THREAD URL DIRECTLY")
        var urlParams = new URLSearchParams(window.location.search)
        this.setState({postID: urlParams.get('postID')})
        this.setState({channelInThread: urlParams.get('channelID')})
        console.log("STILL HERE", window.location)
      }
    }
    console.log(this.state.postID, "THREAD URL CHECKING POST ID", window.location)

    const filled = []
    const rows = this.state.messages

    Object.keys(rows).forEach((key) => {
      filled.push(
        <MessageRow key={key}
          name={name}
          post_id={key}
          message={rows[key][0]}
          user={rows[key][1]}
          userID={userID}
          channelID={id}
          channelInThread = {this.state.channelInThread}
          getThread={this.getThread}/>)})

    if (unread == 0){
      return (
        <div className='message-thread'>
          <div className='message-container'>
            <h2 id='channel-name'> Welcome to Channel {name} </h2>
            <button id='return-channel-list' onClick={this.props.close}> X </button>
            <button className="delete-button" onClick={this.props.deleteChannel}>Delete Channel</button>

            <div id='message-list'>{filled} </div>


            <Compose
              channel={id}
              fetchMessages = {this.fetchMessages}
              channelName = {this.props.name}
              showMessages={this.props.showMessages}
              user={userID}
              display={display}/>

          </div>

          {inPost && <Thread
            user={this.state.user}
            userID={userID}
            postID={this.state.postID}
            channelID={this.state.channelInThread}
            message={this.state.postInThread}
            close={this.closeThread}
            display={display}/>
          }
        </div>
      )
    }else{
      return (
        <div className='message-thread'>
          <div className='message-container'>
            <h2 id='channel-name'> Welcome to Channel {name} </h2>
            <button className="delete-button" onClick={this.props.deleteChannel}>Delete Channel</button>

            <div id='message-list'>{filled} </div>

            <button id='new-messages' onClick={() => {
              this.props.showMessages(name, id);
              this.fetchMessages();
            }}> {unread} New Message(s) Click to view </button>


            <Compose
              channel={id}
              fetchMessages = {this.fetchMessages}
              channelName = {this.props.name}
              showMessages={this.props.showMessages}
              user={userID}
              display={display}/>

          </div>

          {inPost && <Thread
            user={this.state.user}
            userID={userID}
            postID={this.state.postID}
            channelID={this.state.channelInThread}
            message={this.state.postInThread}
            close={this.closeThread}/>
          }
        </div>
    )
    }
    }
  }

// each channel row
class ChannelRow extends React.Component{

  render() {
    const channel_name = this.props.name;
    const id = this.props.id
    const unread = this.props.unread

    return (
      <tr>
        <td id='channel-row'>Channel {channel_name} <button id='unread'>{unread} unread</button></td>
        <td><button className='channel-list-btn' type='button' onClick={()=> {
          this.props.showMessages(channel_name, id);

        }}> Enter Channel! </button></td>
      </tr>
    );
  }
}

class ChannelList extends React.Component{

  create(){
    const name = document.getElementById('create-channel-input').value
    const user_id = this.props.user
    console.log(name, user_id)
    const token = window.localStorage.getItem("session_token")

    var pat = /^(\w)+$/
    if (pat.test(name)){
      console.log('passed channel name test')
      fetch("/api/create-channel", {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({name: name, user: user_id, token:token})
      }).then((response) => {
        if(response.status == 200) {
          console.log('successfully added & session token is good!')
          document.getElementById('create-channel-input').value = '';
          this.props.getChannelList();
        } else if(response.status == 500){
          alert('session_token does not match')
        }else {
          alert('Check if Channel Names are not repeated!')
          console.log(response.status);
        }
      }).catch((response) =>{
        console.log(response);
      })
    } else{
      alert('Channel names must only contain unique strings of numbers, letters, and underscores (and no spaces)')
    }


  }

  render(){
    console.log("RENDERING CHANNEL LIST")
    const filled = []
    const rows = this.props.channelList;
    //console.log('IN CHANNEL LIST', rows);


    Object.keys(rows).forEach((key) => {
      filled.push(
        <ChannelRow key={key}
          name={rows[key][0]}
          id={key}
          unread={rows[key][2]}
          user_id={rows[key][1]}
          showMessages={this.props.showMessages}/>)})

    return (
      <div className='channel-container'>
      <table className='channel-list'>
        <thead>
          <tr>
          <th colSpan='2'> Update Email or Display Name </th></tr>
        </thead>

        <tbody>
          <tr>
              <td><input type='text' id='update-email-input' placeholder='Choose new email'></input></td>
              <td><button type='button' className='channel-list-btn' id='update-email' onClick={this.props.updateEmail} > Update Email </button></td>
          </tr>
          <tr>
              <td><input type='text' id='update-display-input' placeholder='Choose new display name'></input></td>
              <td><button type='button' className='channel-list-btn' id='update-display' onClick={this.props.updateDisplay} > Update <br />Display Name </button></td>
          </tr>
        </tbody>

        <thead>
          <tr>
          <th colSpan='2'> Change Password </th></tr>
        </thead>

        <tbody>
          <tr>
              <td><input type='password' id='current-password' placeholder='Enter Old Password'></input></td>
          </tr>
          <tr>
              <td><input type='password' id='new-password' placeholder='Enter New Password'></input></td>
              <td><button type='button' className='channel-list-btn' id='update-password' onClick={this.props.changePassword} > Update Password </button></td>
          </tr>
        </tbody>

        <thead>
          <tr>
            <th colSpan='2'>Channels Available to Join</th>
          </tr>
        </thead>
        <tbody>
        <tr>
            <td><input type='text' id='create-channel-input' placeholder='Choose Channel Name'></input></td>
            <td><button type='button' className='channel-list-btn' id='create-channel' onClick={() => this.create()} > Create a<br /> New Channel! </button></td>
        </tr>
        </tbody>
        <tbody>{filled}</tbody>


      </table>
      </div>
    );
  }
}

class TitleBar extends React.Component{
  render(){
    if (this.props.display == ''){
      return (
        <div className="title_bar">
          <h1>Welcome to Belay</h1>
        </div>
      );
    } else{
      return (
        <div className="title_bar">
          <h1 id='main-title'>Hello! Welcome to Belay</h1>
        </div>
      );
    }

  }
}

class Login extends React.Component {
  render() {
    if(!this.props.isLoggedIn) {
      return (
        <div>
          <h2>Login or Sign Up</h2>
          <div className="login_form">
            <label htmlFor="email">Email</label>
            <input id="email" value={this.props.email} onChange={this.props.emailHandler}></input>
            <label htmlFor="password">Password</label>
            <input id="password" type="password" value={this.props.password} onChange={this.props.passwordHandler}></input>
            <button className="login_button" onClick={this.props.loginHandler}>
              Log In!
            </button>

            <label>Display Name</label>
            <p>Required for Sign Ups!  </p>
            <label htmlFor="display_name">Display Name</label>
            <input id="display_name" value={this.props.display} onChange={this.props.displayNameHandler}></input>
            <button className="signup_button" onClick={this.props.signupHandler}>
              Sign Up!
            </button>
          </div>
        </div>
      );
    }
    else {
      return (
        <div className="logout_button">
          <button onClick={this.props.logoutHandler}>
            Logout
          </button>
        </div>
      );
    }
  }
}

class Belay extends React.Component {

  constructor(props) {
    super(props);
    this.emailHandler = this.emailHandler.bind(this);
    this.passwordHandler = this.passwordHandler.bind(this);
    this.displayNameHandler = this.displayNameHandler.bind(this)
    this.signupHandler = this.signupHandler.bind(this);
    this.logoutHandler = this.logoutHandler.bind(this);
    this.loginHandler = this.loginHandler.bind(this);
    this.updateEmail = this.updateEmail.bind(this);
    this.updateDisplay = this.updateDisplay.bind(this);
    this.getChannelList = this.getChannelList.bind(this);
    this.showMessages = this.showMessages.bind(this);
    this.deleteChannel = this.deleteChannel.bind(this);
    this.changePassword = this.changePassword.bind(this);
    this.closeChannel = this.closeChannel.bind(this);

    this.state = {
      userID: 'default',
      loggedIn:false,
      channelIn:null,
      channelInID:null,
      email: '',
      password: '',
      display: '',
      channels: '',
    }
  }

  emailHandler(e) {
    this.setState({email: e.target.value});
  }

  passwordHandler(e) {
    this.setState({password: e.target.value});
  }

  displayNameHandler(e) {
    this.setState({display: e.target.value});
  }

  logoutHandler() {
    window.localStorage.removeItem("session_token");
    window.localStorage.setItem("loggedIn", false)
    this.setState({loggedIn: false});
    this.setState({channelIn: null});
    this.setState({channelInID: null});
    clearInterval(this.timer);
    this.timer = null;
    history.pushState(null, null, `http://${window.location.hostname}:5000/`);
  }

  getChannelList(){
    //console.log('in getchannellist function!');
    const userID = this.state.userID;
    const token = window.localStorage.getItem("session_token")

    if (token==''){
      console.log(token, 'CHECKING token should be empty')
    } else {
      if (userID != 'default'){
        fetch("/api/channel-list", {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({user: userID, token:token})
        }).then((response) => {
          if(response.status == 200) {
            response.json().then((data) => {
              console.log('session token correct and got channel list!')
              this.setState({channels: data})
              //console.log('CHANNEL LIST DATA', data)
            });
          }else if (response.status == 500){
            alert('session token incorrect!')
          }else {
            console.log(response.status);
          }
        }).catch((response) =>{
          console.log(response);
        })
      }
    }
  }

  updateEmail(){
    const email = document.getElementById('update-email-input').value
    const token = window.localStorage.getItem("session_token")
    const id = this.state.userID
    fetch("/api/update-email", {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({email: email, id: id, token:token})
    }).then((response) => {
      if (response.status == 200){
        console.log('session_token good!')
        this.setState({email: email});
        //console.log(this.state.email);
        document.getElementById('update-email-input').value = '';
      } else if (response.status == 500){
        alert('session token incorrect')
      }else{
        alert('email update failed');
      }

    }).catch((response) =>{
      console.log(response);
    })
  }

  updateDisplay(){
    const display = document.getElementById('update-display-input').value
    const id = this.state.userID
    const token = window.localStorage.getItem("session_token")
    fetch("/api/update-display", {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({display_name: display, id: id, token:token})
    }).then((response) => {
      if (response.status==200){
        console.log('session_token good!')
        this.setState({display: display});
        console.log('CHECKING UPDATED DISPLAY', this.state.display);
        document.getElementById('update-display-input').value = '';
      } else if (response.status == 500){
        alert('session token incorrect')
      }else{
        alert('display name update failed')
      }
    }).catch((response) =>{
      console.log(response);
    })
  }

  changePassword(){
    const current_password = document.getElementById('current-password').value
    const new_password = document.getElementById('new-password').value
    console.log('checking userID', this.state.userID, current_password, new_password)
    const id = this.state.userID
    const token = window.localStorage.getItem("session_token")

    fetch("/api/change-password", {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({current: current_password, new: new_password, id: id, token:token})
    }).then((response) => {
      console.log('changePassword response!')
      if (response.status==200){
        console.log('session_token good!')
        document.getElementById('current-password').value = '';
        document.getElementById('new-password').value = '';
      } else if (response.status == 500){
        alert('session token incorrect')
      }else if (response.status==401){
        alert('incorrect current password')
      }else{
        alert('password change failed')
      }
    }).catch((response) =>{
      console.log(response);
    })
  }

  signupHandler() {
    const email = this.state.email;
    const password = this.state.password;
    const display = this.state.display;
    const token = window.localStorage.getItem("session_token")

    fetch("/api/signup", {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({email: email, password: password, display_name: display})
    }).then((response) => {
      if(response.status == 200) {
        response.json().then((data) => {
          window.localStorage.setItem("session_token", data.session_token);
          console.log("SIGN UP SESSION TOKEN", data.session_token, window.localStorage.getItem("session_token"))
          this.setState({userID: data.user_id});
          this.setState({loggedIn: true});
          window.localStorage.setItem("loggedIn", true);
          window.localStorage.setItem("display", data.display)
          window.localStorage.setItem("userID", data.user_id)
          history.pushState(null, null, `http://${window.location.hostname}:5000/channel-list`);

        });

      } else if(response.status == 302) {
        console.log(response.status);
        this.logoutHandler();
        alert('Email already has an account. Try a different email! ')
      }else {
        console.log(response.status);
        this.logoutHandler();
      }
    }).catch((response) =>{
      console.log(response);
      this.logoutHandler();
    })
  }

  loginHandler() {
    const email = this.state.email;
    const password = this.state.password;
    const id = this.state.userID;

    fetch("/api/login", {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({email: email, password: password})
    }).then((response) => {
      if(response.status == 200) {
        response.json().then((data) => {
          window.localStorage.setItem("session_token", data.session_token);
          this.setState({userID: data.id});
          this.setState({display: data.display_name});
          this.setState({loggedIn: true});
          window.localStorage.setItem("loggedIn", true);
          window.localStorage.setItem("display", data.display_name)
          window.localStorage.setItem("userID", data.id)

          console.log( window.localStorage.getItem("display"), window.localStorage.getItem("userID"), "CHECKING IF SET IN LOCALSTORAGE")
          if (window.location.search != ''){
            this.channelDirect();
          } else{
            history.pushState(null, null, `http://${window.location.hostname}:5000/channel-list`);}

        });

      } else if(response.status == 404) {
        console.log(response.status);
        this.logoutHandler();
        alert('Incorrect Password. Try Again! ')
      }else {
        console.log(response.status);
        this.logoutHandler();
      }
    }).catch((response) =>{
      console.log(response);
      this.logoutHandler();
    })
  }

  deleteChannel(){
    const channel_id = this.state.channelInID;
    const user_id = this.state.userID;

    console.log(channel_id, user_id, "CHECKING IF MATCHES!")

    fetch("/api/delete-channel", {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({channel_id: channel_id, user_id: user_id})
    }).then((response) => {
      if(response.status == 200) {
        console.log('successfully deleted')
        this.setState({channelIn:null});
        this.setState({channelInID:null});
      }else if (response.status==401) {
        console.log(response.status);
        alert(`You're not the user that created the channel. Thus, you don't have the right to delete!`)
      }
    }).catch((response) =>{
      console.log(response);
    })
  }

  showMessages(name, id) {
    console.log(name, id, 'CALLING SHOW MESSAGES');
    this.setState({channelIn: name});
    this.setState({channelInID: id});
    const userID = this.state.userID;
    const token = window.localStorage.getItem("session_token")

    //update the last seen message_id
    fetch("/api/update-unread", {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({channelID: id, userID: userID, token:token})
    }).then((response) => {
      if (response.status==200){
        console.log('session_token good!')
        console.log('updated unread at backened!')
      } else if (response.status == 500){
        alert('session token incorrect')
      }
    }).catch((response) =>{
      console.log(response);
    })

    if (window.location.pathname != '/thread'){
      history.pushState(null, null, `http://${window.location.hostname}:5000/channel?id=${id}&name=${name}`);
    }

    ;
  }

  updateLoggedIn(){
    console.log('already logged in before')
    const display = window.localStorage.getItem("display")
    const userID = window.localStorage.getItem("userID")
    this.setState({loggedIn:true})
    this.setState({userID: userID});
    this.setState({display: display});

    console.log(window.location.pathname, "CHECKING PATHNAME!")
    if (window.location.pathname == '/channel-list'){
      history.pushState(null, null, `http://${window.location.hostname}:5000/channel-list`);
    } else if (window.location.pathname == '/'){
      history.pushState(null, null, `http://${window.location.hostname}:5000/channel-list`);
    }
  }

  channelDirect(){
    var urlParams = new URLSearchParams(window.location.search)
    this.setState({channelInID: urlParams.get('id')});
    this.setState({channelIn: urlParams.get('name')})
  }

  threadDirect(){
    var urlParams = new URLSearchParams(window.location.search)
    this.setState({channelInID: urlParams.get('channelID')});
    this.setState({channelIn: urlParams.get('channelname')})
  }

  closeChannel(){
    this.setState({channelIn: null})
    this.setState({channelInID: null})
    history.pushState(null, null, `http://${window.location.hostname}:5000/channel-list`);
  }

  componentDidMount() {
    console.log('mounted for get channellist')
    this.getChannelList();
    this.timer = setInterval(() => this.getChannelList(), 1000)
  }

  componentWillUnmount(){
    clearInterval(this.timer);
    this.timer = null;
  }


  render() {

    const channelIn = this.state.channelIn;
    const loggedIn = this.state.loggedIn;
    const loggedIn2 = window.localStorage.getItem("loggedIn")
    const path = window.location.pathname

    // logged in before but refreshed or entered url directly after logging in
    if (loggedIn2 == 'true') {
      //console.log(loggedIn2, 'here')
      if (!loggedIn){
        //console.log('here2')
        this.updateLoggedIn();
        if (window.location.pathname == '/channel'){
          console.log("CHANNEL DIRECTLY", window.location.pathname)
          this.channelDirect();
        } else if (window.location.pathname == '/thread'){
          console.log("THREAD DIRECTLY")
          this.threadDirect();
        }
      }
    }

      return (

        <div id='root-container'>
        <TitleBar display={this.state.display} />
        <Login
          isLoggedIn={this.state.loggedIn}
          email={this.state.email}
          password={this.state.password}
          display={this.state.display}
          emailHandler={this.emailHandler}
          displayNameHandler={this.displayNameHandler}
          passwordHandler={this.passwordHandler}
          signupHandler={this.signupHandler}
          logoutHandler={this.logoutHandler}
          loginHandler={this.loginHandler}
        />
        {loggedIn && <ChannelList
          user= {this.state.userID}
          showMessages={this.showMessages}
          updateEmail={this.updateEmail}
          changePassword={this.changePassword}
          updateDisplay={this.updateDisplay}
          channelFunc = {this.getChannelList}
          channelList={this.state.channels}
          getChannelList={this.getChannelList}/>}

        {channelIn && <MessageList
          name={channelIn}
          showMessages={this.showMessages}
          id={this.state.channelInID}
          user_id={this.state.userID}
          display={this.state.display}
          deleteChannel={this.deleteChannel}
          channelsInfo={this.state.channels}
          close={this.closeChannel} />}
        </div>
      );


  }
}

ReactDOM.render(
  React.createElement(Belay),
  document.getElementById('root')
);
