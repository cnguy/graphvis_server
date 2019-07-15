package server

import (
	"os"
	"net/http"
	"context"
	"github.com/gorilla/mux"
	"github.com/brotaku13/graphvis_server/internal/logger"
)

type app struct {
	Router *mux.Router
	logger *logger.Logger
}

func newApp(ctx context.Context) *app{
	a := new(app)
	a.init(ctx)
	return a
}

func (a *app) init(ctx context.Context) {
	a.logger = logger.NewLogger("app")

	a.logger.Info("Setting up router configuration")
	//configure router
	a.Router = mux.NewRouter()
	a.initRoutes(ctx)

}

func (a *app) initGoogle() {
	a.logger.Info("Initializing google client")

	googleKey := os.Getenv("GOOGLE_KEY")
	googleSecret := os.Getenv("GOOGLE_SECRET")
	if googleKey == "" || googleSecret == "" {
		a.logger.Fatal("Could not find google credentials in environemnt")
	}
}

func (a *app) initRoutes(ctx context.Context){
	a.logger.Info("Configuring Routes")

	a.Router.HandleFunc("/auth/google", a.handleAuth).Methods("GET")
	a.logger.Info("auth/google set")
}

func (a *app) handleAuth(w http.ResponseWriter, r *http.Request){
	w.Write([]byte("I made it!!!\n"))
}