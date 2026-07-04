package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"

	"github.com/mdp/qrterminal/v3"
	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/store/sqlstore"
	waLog "go.mau.fi/whatsmeow/util/log"
	_ "modernc.org/sqlite"
)

// App bundles the live WhatsApp client together with our local history
// store, so both the event handlers and the HTTP API can share them.
type App struct {
	Client *whatsmeow.Client
	Store  *MessageStore
}

func main() {
	if err := os.MkdirAll("store", 0755); err != nil {
		log.Fatalf("failed to create store directory: %v", err)
	}

	ctx := context.Background()
	dbLog := waLog.Stdout("Database", "INFO", true)
	container, err := sqlstore.New(ctx, "sqlite",
		"file:store/whatsapp.db?_pragma=foreign_keys(1)&_pragma=busy_timeout(10000)&_pragma=journal_mode(WAL)",
		dbLog)
	if err != nil {
		log.Fatalf("failed to open device store: %v", err)
	}

	existingDevices, err := container.GetAllDevices(ctx)
	if err != nil {
		log.Fatalf("failed to list devices in store: %v", err)
	}
	if abs, absErr := filepath.Abs("store/whatsapp.db"); absErr == nil {
		log.Printf("device store file: %s (%d device(s) found)", abs, len(existingDevices))
	} else {
		log.Printf("%d device(s) found in store", len(existingDevices))
	}
	for _, d := range existingDevices {
		log.Printf("  existing device: %s", d.GetJID())
	}

	deviceStore, err := container.GetFirstDevice(ctx)
	if err != nil {
		log.Fatalf("failed to load device: %v", err)
	}

	msgStore, err := NewMessageStore("store/messages.db")
	if err != nil {
		log.Fatalf("failed to open message store: %v", err)
	}
	defer msgStore.Close()

	clientLog := waLog.Stdout("Client", "INFO", true)
	client := whatsmeow.NewClient(deviceStore, clientLog)

	app := &App{Client: client, Store: msgStore}
	client.AddEventHandler(app.eventHandler)

	if client.Store.ID == nil {
		// No session yet: request a QR code and wait for the user to scan it
		// with WhatsApp on their phone (Settings > Linked Devices).
		qrChan, err := client.GetQRChannel(ctx)
		if err != nil {
			log.Fatalf("failed to get QR channel: %v", err)
		}
		if err := client.Connect(); err != nil {
			log.Fatalf("failed to connect: %v", err)
		}
		for evt := range qrChan {
			if evt.Event == "code" {
				fmt.Println("\nScan this QR code with WhatsApp (Linked Devices > Link a Device):")
				qrterminal.GenerateHalfBlock(evt.Code, qrterminal.L, os.Stdout)
			} else {
				fmt.Println("Login event:", evt.Event)
			}
		}
	} else {
		if err := client.Connect(); err != nil {
			log.Fatalf("failed to connect: %v", err)
		}
	}

	port := os.Getenv("BRIDGE_PORT")
	if port == "" {
		port = "8080"
	}
	go StartAPI(app, port)

	log.Printf("WhatsApp bridge running. REST API listening on :%s", port)

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
	<-sigChan

	log.Println("Shutting down...")
	client.Disconnect()
}
