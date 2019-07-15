package logger

import (
	"fmt"
	"log"
	"os"
)

type Logger struct {
	InfoLogger 		*log.Logger
	WarnLogger	 	*log.Logger
	ErrorLogger 	*log.Logger
	owner			string
}

func NewLogger(owner string) *Logger{
	l := new(Logger)
	l.Init(owner)
	return l
}

func (l *Logger) Init(owner string){
	l.owner = owner
	l.InfoLogger  = log.New(os.Stdout,  prefix("INFO", l.owner),  log.Ldate | log.Ltime)
	l.ErrorLogger = log.New(os.Stderr,  prefix("ERROR", l.owner), log.Ldate | log.Ltime)
	l.WarnLogger  = log.New(os.Stdout,  prefix("WARN", l.owner),  log.Ldate | log.Ltime)
	
	l.Info("New logger configured and ready to use")
}

func prefix(logType string, owner string) string {
	return fmt.Sprintf("[ %s ] %s: ", logType, owner)
}

func (l *Logger) Fatal(msg string){
	l.WarnLogger.Fatal(msg)
}

func (l *Logger) Info(msg string){
	l.InfoLogger.Println(msg)
}

func (l *Logger) Warn(msg string){
	l.WarnLogger.Println(msg)
}

func (l *Logger) Error(msg string){
	l.ErrorLogger.Println(msg)
}