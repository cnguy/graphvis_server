package server


import (
	"fmt"
	"time"
	"flag"
)

type config struct {
	Port	int
	Host	string
	CloseTimeout	time.Duration
}

func newConfig() *config{
	c := new(config)
	c.init()
	return c
}
// Init retrieves all of the argments from the command line
func (c *config) init(){
	flag.DurationVar(&c.CloseTimeout, "graceful-timeout", time.Second * 15, "The duration for which the server gracefully waits for connections to finish before shutting down")
	flag.IntVar(&c.Port, "port", 8000, "Port to run the server on. Defaults to 8000")
	flag.StringVar(&c.Host, "host", "0.0.0.0", "Ip address we are Hosting the servr on")
	flag.Parse()
}

// HostAddress returns the full host address in a readable string form
func (c *config) hostAddress() string {
	return fmt.Sprintf("%s:%d", c.Host, c.Port)
}