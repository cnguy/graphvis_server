package server

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"fmt"
	"github.com/brotaku13/graphvis_server/internal/logger"
)


type Server struct{
	app 	*app
	logger 	*logger.Logger
	config 	*config
	srv 	*http.Server
}

func (s *Server) start(){
	s.logger.Info(fmt.Sprintf("Starting server on %s", s.config.hostAddress()))
	if err := s.srv.ListenAndServe(); err != nil{
		s.logger.Error(err.Error())
	}
}

func (s *Server) Start(){
	ctx := context.Background()
	s.logger = logger.NewLogger("server")

	s.logger.Info("Configuring application logic")
	s.app = newApp(ctx)

	//find configuration variables
	s.logger.Info("Parsing program arguments")
	s.config = newConfig()
	

	//setting up server configuration
	s.logger.Info("Initializing server")
	s.srv = &http.Server{
		Addr: 			s.config.hostAddress(),
		WriteTimeout: 	s.config.CloseTimeout,
		ReadTimeout:  	s.config.CloseTimeout,
		IdleTimeout:  	s.config.CloseTimeout * 2,
		Handler: 		s.app.Router,
	}

	go s.start()

	interruptChannel := make(chan os.Signal, 1)

	signal.Notify(interruptChannel, os.Interrupt)
	<-interruptChannel
	s.logger.Warn("Interrupt signal recieved")

	ctx, cancel := context.WithTimeout(context.Background(), s.config.CloseTimeout)
	defer cancel()

	s.srv.Shutdown(ctx)

	s.logger.Info("Shutting down graphvis server")
	os.Exit(0)
}