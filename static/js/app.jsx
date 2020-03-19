{/* 
    UI consists of 4 apps
    1. Main App (launch the application)
    2. LoggedIn
    3. Home (non logged in user)
    4. Product
*/}

var App = React.createClass({
    componentWillMount: function() {
        this.setupAjax();
        this.parseHash();
        this.setState();
    },

     // Add access_token if available with each XHR request to API
     setupAjax: function(){
         $.ajaxSetup({
            'beforeSend': function(xhr){
                if (localStorage.getItem('access_token')){
                    xhr.setRequestHeader('Authorization', 'Bearer ' + localStorage.getItem('access_token'));
                }
            }

         });

     },

     // Extract the access_token and id_token from Auth0 Callback after login
     parseHash: function(){
         this.auth0 = new auth0.WebAuth({
            domain: AUTH0_DOMAIN,
            clientID: AUTH0_CLIENT_ID
         });
         this.auth0.parseHash(window.location.hash, function(err, authResult) {
            if (err) {
                return console.log(err);
              }
              if(authResult !== null && authResult.accessToken !== null && authResult.idToken !== null){
                localStorage.setItem('access_token', authResult.accessToken);
                localStorage.setItem('id_token', authResult.idToken);
                localStorage.setItem('profile', JSON.stringify(authResult.idTokenPayload));
                window.location = window.location.href.substr(0, window.location.href.indexOf('#'))
                }
            });

     },

      // Set user login state
     setState(){

        var idToken = localStorage.getItem('id_token');
        if(idToken){
            this.loggedIn = true;
        }else {
            this.loggedIn = false;
        }

     },
    render: function() {
  
      if (this.loggedIn) {
        return (<LoggedIn />);
      } else {
        return (<Home />);
      }
    }
  });

  {/* Home app
    It will be displayed when the user don't have idToken i.e. non logged in user
    Provide the functionality to login
*/}
  var Home = React.createClass({
    // On clicking the login link, user will be redirected to Hosted Lock page
    // after user provides the creds, application will redirect back to the app
    authenticate: function(){
        this.webAuth = new auth0.WebAuth({
        domain:       AUTH0_DOMAIN,
        clientID:     AUTH0_CLIENT_ID,
        scope:        'openid profile',
        audience:     AUTH0_API_AUDIENCE,
        responseType: 'token id_token',
        redirectUri : AUTH0_CALLBACK_URL
        });
        this.webAuth.authorize()
    },

    render: function() {
      return (
      <div className="container">
        <div className="col-xs-12 jumbotron text-center">
          <h1>We R VR</h1>
          <p>Provide valuable feedback to VR experience developers.</p>
          <a onClick={this.authenticate} className="btn btn-primary btn-lg btn-login btn-block">Sign In</a>
        </div>
      </div>);
    }
  });

{/* LoggedIn app
    It will be displayed when the user have idToken i.e. logged in user
    This will call the API to pull the product details
    
*/}

var LoggedIn = React.createClass({

  // Remove the tokens from the localstorage if user logs out
  logout: function(){
    localStorage.removeItem('id_token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('profile');
    location.reload();

  },
    
    getInitialState: function(){
        return {
            products: []
        }

    },

    //Make call to golang API
    componentDidMount: function(){
      this.serverRequest = $.get("http://localhost:3000/products", function(result){
        this.setState({
          products: result,
        });
      }.bind(this));

    },

    render: function(){
        return (
            <div className="col-lg-12">
                <span className="pull-right"><a onClick={this.logout}>Log out</a></span>
                <h2>Welcome to We R VR</h2>
                <p>Below you'll find the latest games that need feedback. Please provide honest feedback so developers can make the best games.</p>
                <div className="row">
                {this.state.products.map(function(product,i){
                    return <Product key={i} product={product}/>
                })}
                </div>
            </div>
        );
    }
});

{/* Product app
    It will be displayed product list
*/}

var Product = React.createClass({
    upvote: function(){
      var product = this.props.product;
    this.serverRequest = $.post('http://localhost:3000/products/' + product.Slug + '/feedback', {vote : 1}, function (result) {
      this.setState({voted: "Upvoted"})
    }.bind(this));

    },
    downvote: function(){
      var product = this.props.product;
    this.serverRequest = $.post('http://localhost:3000/products/' + product.Slug + '/feedback', {vote : -1}, function (result) {
      this.setState({voted: "Downvoted"})
    }.bind(this));

    },
    getInitialState: function(){
        return {
            voted: null
        }
    },
    render: function(){
        return(
            <div className="col-xs-4">
            <div className="panel panel-default">
              <div className="panel-heading">{this.props.product.Name} <span className="pull-right">{this.state.voted}</span></div>
              <div className="panel-body">
                {this.props.product.Description}
              </div>
              <div className="panel-footer">
                <a onClick={this.upvote} className="btn btn-default">
                  <span className="glyphicon glyphicon-thumbs-up"></span>
                </a>
                <a onClick={this.downvote} className="btn btn-default pull-right">
                  <span className="glyphicon glyphicon-thumbs-down"></span>
                </a>
              </div>
            </div>
          </div>
        );
    }
});

  {/* Render the main app */}
  ReactDOM.render(<App />, document.getElementById('app'));