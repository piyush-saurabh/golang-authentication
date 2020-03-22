# Authentication in Golang
Build a REST API in golang and protect them with authentication using OAuth

Ref: https://auth0.com/blog/authentication-in-golang/

Used [Auth0](https://auth0.com/) for authentication-as-a-service. This will act as Authorization Server

## Code Snippets

### Starting Web Server with multiplexing and handlers
```go
import "github.com/gorilla/mux"

 func main(){
    // Create a multiplexer/router
     r := mux.NewRouter()

    // Add a handler
    r.Handle("/status", StatusHandler).Methods("GET")

    // Add authentication middleware to the handler
    r.Handle("/products", authMiddleware(ProductHandler)).Methods("GET")

    // Start server with log handler
	http.ListenAndServe(":3000", handlers.LoggingHandler(os.Stdout, r))
 }
```

### Create a handler

```go
// StatusHandler is invoked for '/status' endpoint
var StatusHandler = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
	w.Write([]byte("API is un and running"))
})
```

### Send response from handler
```go
var ProductHandler = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

	// Convert slice into JSON
	payload, _ := json.Marshal(products)

	// Set the application response header
	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(payload))
})
```

### Read URL Parameters in handler

```go
r.Handle("/products/{slug}/feedback", NotImplemented).Methods("POST")
	vars := mux.Vars(r)
	slug := vars["slug"]
```



### Create a authentication middleware

```go
func authMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

        // Authentication Logic

        if err != nil {
			fmt.Println(err)
			fmt.Println("Token is not valid:", token)
			w.WriteHeader(http.StatusUnauthorized)
			w.Write([]byte("Unauthorized"))
		} else {
			next.ServeHTTP(w, r)
		}

    })
}
```

### Create JWT Token
Use github.com/dgrijalva/jwt-go package

```go
token := jwt.New(jwt.SigningMethodHS256)

// Add claims
claims := token.Claims.(jwt.MapClaims)
claims["name"] = "Rogue Security"
claims["aud"] = "microserivce-1"

// Sign the token with the secret
tokenString, _ := token.SignedString("secretkey")

// Return back the token
w.Write([]byte(tokenString))
})
```

### Verify JWT using middleware

```go
var jwtMiddleware = jwtmiddleware.New(jwtmiddleware.Options{
	ValidationKeyGetter: func(token *jwt.Token) (interface{}, error) {
		return jwtSigningKey, nil
	},
	SigningMethod: jwt.SigningMethodHS256,
})
```



## Go packages used

| Package Name  | Purpose             |
|---------------|-------------------|
| gorilla/mux | Web Application Framework
|dgrijalva/jwt-go | Creating new JWT
| gopkg.in/square/go-jose.v2 | For working with OAuth2
| github.com/auth0-community/auth0 | Validating JWT generated if Auth0 is used as Authorization Server


