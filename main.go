package main

import (
	"encoding/json"
	"net/http"
	"os"
	"time"

	jwtmiddleware "github.com/auth0/go-jwt-middleware"
	"github.com/dgrijalva/jwt-go"
	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
)

// Product ontain the information about VR experiences
type Product struct {
	ID          int
	Name        string
	Slug        string
	Description string
}

// Create the sample VR experience
var products = []Product{
	Product{ID: 1, Name: "Hover Shooters", Slug: "hover-shooters", Description: "Shoot your way to the top on 14 different hoverboards"},
	Product{ID: 2, Name: "Ocean Explorer", Slug: "ocean-explorer", Description: "Explore the depths of the sea in this one of a kind underwater experience"},
	Product{ID: 3, Name: "Dinosaur Park", Slug: "dinosaur-park", Description: "Go back 65 million years in the past and rIDe a T-Rex"},
	Product{ID: 4, Name: "Cars VR", Slug: "cars-vr", Description: "Get behind the wheel of the fastest cars in the world."},
	Product{ID: 5, Name: "Robin Hood", Slug: "robin-hood", Description: "Pick up the bow and arrow and master the art of archery"},
	Product{ID: 6, Name: "Real World VR", Slug: "real-world-vr", Description: "Explore the seven wonders of the world in VR"},
}

func main() {

	// Web server consists of 2 parts
	// 1. Multiplexer/Router
	// 2. Request Handler

	// Create a multiplexer/router
	r := mux.NewRouter()

	// Register the Default Handler
	r.Handle("/", http.FileServer(http.Dir("./views/")))

	// Set the static path to serve static contents like images, css, js
	r.PathPrefix("/static/").Handler(http.StripPrefix("/static/", http.FileServer(http.Dir("./static/"))))

	// Register Custom Handlers for 3 endpoints
	// The custom handler 'NotImplemented' should be implemented
	r.Handle("/status", StatusHandler).Methods("GET")

	// Add Middleware for authentication of APIs
	r.Handle("/products", jwtMiddleware.Handler(ProductHandler)).Methods("GET")
	r.Handle("/products/{slug}/feedback", jwtMiddleware.Handler(AddFeedbackHandler)).Methods("POST")

	// Create a route to generate new JWT
	r.Handle("/get-token", GetTokenHandler).Methods("GET")

	// Start the server with global middleware/handler
	// This is the default handler which will display logging info on terminal
	http.ListenAndServe(":3000", handlers.LoggingHandler(os.Stdout, r))

}

// NotImplemented is the Custom Handler
var NotImplemented = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
	w.Write([]byte("This endpoint is not yet implemented"))
})

// StatusHandler is invoked for '/status' endpoint
var StatusHandler = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
	w.Write([]byte("API is un and running"))
})

// ProductHandler is invoked for '/status' endpoint
var ProductHandler = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

	// Convert slice into JSON
	payload, _ := json.Marshal(products)

	// Set the application response header
	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(payload))
})

// AddFeedbackHandler will add positive or negative feedback and save for e.g in database
var AddFeedbackHandler = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

	var product Product

	// Read value from the URL
	vars := mux.Vars(r)
	slug := vars["slug"]

	for _, p := range products {
		if p.Slug == slug {
			product = p
		}
	}

	w.Header().Set("Content-Type", "application/json")

	if product.Slug != "" {
		payload, _ := json.Marshal(product)
		w.Write([]byte(payload))
	} else {
		w.Write([]byte("Product Not Found"))

	}

})

// JWT signing key
var jwtSigningKey = []byte("Sup3rS3cr3T")

// GetTokenHandler is the handler for '/get-token' which returns a JWT token
var GetTokenHandler = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

	// Specify the Signing Algorithm
	// Uses github.com/dgrijalva/jwt-go package
	token := jwt.New(jwt.SigningMethodHS256)

	// Create the JWT claims
	claims := token.Claims.(jwt.MapClaims)
	claims["admin"] = true
	claims["name"] = "Rogue Security"
	claims["aud"] = "microserivce-1"
	claims["exp"] = time.Now().Add(time.Hour * 24).Unix()

	// Sign the token with the secret
	tokenString, _ := token.SignedString(jwtSigningKey)

	w.Write([]byte(tokenString))
})

// jwtMiddleware is the middleware for verifying the token
// Uses the package github.com/auth0/go-jwt-middleware
// This middleware will be registered with all the APIs
var jwtMiddleware = jwtmiddleware.New(jwtmiddleware.Options{
	ValidationKeyGetter: func(token *jwt.Token) (interface{}, error) {
		return jwtSigningKey, nil
	},
	SigningMethod: jwt.SigningMethodHS256,
})
