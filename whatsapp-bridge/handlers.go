package main

import (
	"context"
	"log"
	"time"

	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/proto/waE2E"
	"go.mau.fi/whatsmeow/proto/waWeb"
	"go.mau.fi/whatsmeow/types"
	"go.mau.fi/whatsmeow/types/events"
)

// extractText pulls a best-effort human-readable body out of a message,
// covering the message types people actually send day to day.
func extractText(msg *waE2E.Message) (content, mediaType, filename string) {
	switch {
	case msg == nil:
		return "", "", ""
	case msg.GetConversation() != "":
		return msg.GetConversation(), "", ""
	case msg.GetExtendedTextMessage() != nil:
		return msg.GetExtendedTextMessage().GetText(), "", ""
	case msg.GetImageMessage() != nil:
		return msg.GetImageMessage().GetCaption(), "image", ""
	case msg.GetVideoMessage() != nil:
		return msg.GetVideoMessage().GetCaption(), "video", ""
	case msg.GetAudioMessage() != nil:
		return "", "audio", ""
	case msg.GetDocumentMessage() != nil:
		return msg.GetDocumentMessage().GetCaption(), "document", msg.GetDocumentMessage().GetFileName()
	case msg.GetStickerMessage() != nil:
		return "", "sticker", ""
	default:
		return "", "", ""
	}
}

func mediaInfo(msg *waE2E.Message) (directPath string, key, fileSHA256, fileEncSHA256 []byte, length uint64) {
	switch {
	case msg.GetImageMessage() != nil:
		m := msg.GetImageMessage()
		return m.GetDirectPath(), m.GetMediaKey(), m.GetFileSHA256(), m.GetFileEncSHA256(), m.GetFileLength()
	case msg.GetVideoMessage() != nil:
		m := msg.GetVideoMessage()
		return m.GetDirectPath(), m.GetMediaKey(), m.GetFileSHA256(), m.GetFileEncSHA256(), m.GetFileLength()
	case msg.GetAudioMessage() != nil:
		m := msg.GetAudioMessage()
		return m.GetDirectPath(), m.GetMediaKey(), m.GetFileSHA256(), m.GetFileEncSHA256(), m.GetFileLength()
	case msg.GetDocumentMessage() != nil:
		m := msg.GetDocumentMessage()
		return m.GetDirectPath(), m.GetMediaKey(), m.GetFileSHA256(), m.GetFileEncSHA256(), m.GetFileLength()
	default:
		return "", nil, nil, nil, 0
	}
}

func chatDisplayName(ctx context.Context, client *whatsmeow.Client, jid types.JID, pushName string) string {
	if jid.Server == types.GroupServer {
		if info, err := client.GetGroupInfo(ctx, jid); err == nil && info.Name != "" {
			return info.Name
		}
		return jid.User
	}
	if contact, err := client.Store.Contacts.GetContact(ctx, jid); err == nil && contact.Found {
		if contact.FullName != "" {
			return contact.FullName
		}
		if contact.FirstName != "" {
			return contact.FirstName
		}
		if contact.BusinessName != "" {
			return contact.BusinessName
		}
	}
	if pushName != "" {
		return pushName
	}
	return jid.User
}

func (app *App) storeIncomingMessage(ctx context.Context, info types.MessageInfo, raw *waE2E.Message) {
	content, mediaType, filename := extractText(raw)
	if content == "" && mediaType == "" {
		return
	}
	directPath, key, fileSHA256, fileEncSHA256, length := mediaInfo(raw)

	name := chatDisplayName(ctx, app.Client, info.Chat, info.PushName)
	if err := app.Store.StoreChat(info.Chat.String(), name, info.Timestamp); err != nil {
		log.Printf("failed to store chat %s: %v", info.Chat, err)
	}

	sender := info.Sender.User
	if err := app.Store.StoreMessage(StoredMessage{
		ID:            info.ID,
		ChatJID:       info.Chat.String(),
		Sender:        sender,
		Content:       content,
		Timestamp:     info.Timestamp,
		IsFromMe:      info.IsFromMe,
		MediaType:     mediaType,
		Filename:      filename,
		DirectPath:    directPath,
		MediaKey:      key,
		FileSHA256:    fileSHA256,
		FileEncSHA256: fileEncSHA256,
		FileLength:    length,
	}); err != nil {
		log.Printf("failed to store message %s: %v", info.ID, err)
	}
}

func (app *App) eventHandler(rawEvt interface{}) {
	ctx := context.Background()
	switch evt := rawEvt.(type) {
	case *events.Message:
		app.storeIncomingMessage(ctx, evt.Info, evt.Message)

	case *events.HistorySync:
		app.handleHistorySync(ctx, evt)

	case *events.Connected:
		log.Println("Connected to WhatsApp")

	case *events.LoggedOut:
		log.Println("Device logged out, please restart the bridge and re-scan the QR code")

	default:
		_ = evt
	}
}

// handleHistorySync stores the batch of past conversations WhatsApp sends
// down right after login so search/list tools have something to work with
// immediately, without waiting for new messages to arrive.
func (app *App) handleHistorySync(ctx context.Context, evt *events.HistorySync) {
	for _, conv := range evt.Data.GetConversations() {
		jid, err := types.ParseJID(conv.GetID())
		if err != nil {
			continue
		}
		var lastTimestamp time.Time
		name := conv.GetName()

		for _, histMsg := range conv.GetMessages() {
			webMsg := histMsg.GetMessage()
			if webMsg == nil || webMsg.GetMessage() == nil {
				continue
			}
			info := types.MessageInfo{
				MessageSource: types.MessageSource{
					Chat:     jid,
					Sender:   getMessageSender(webMsg, jid),
					IsFromMe: webMsg.GetKey().GetFromMe(),
					IsGroup:  jid.Server == types.GroupServer,
				},
				ID:        webMsg.GetKey().GetID(),
				PushName:  webMsg.GetPushName(),
				Timestamp: time.Unix(int64(webMsg.GetMessageTimestamp()), 0),
			}
			app.storeIncomingMessage(ctx, info, webMsg.GetMessage())
			if info.Timestamp.After(lastTimestamp) {
				lastTimestamp = info.Timestamp
			}
		}

		if name == "" {
			name = chatDisplayName(ctx, app.Client, jid, "")
		}
		if lastTimestamp.IsZero() {
			lastTimestamp = time.Now()
		}
		if err := app.Store.StoreChat(jid.String(), name, lastTimestamp); err != nil {
			log.Printf("failed to store synced chat %s: %v", jid, err)
		}
	}
}

func getMessageSender(webMsg *waWeb.WebMessageInfo, chat types.JID) types.JID {
	if p := webMsg.GetParticipant(); p != "" {
		if jid, err := types.ParseJID(p); err == nil {
			return jid
		}
	}
	if webMsg.GetKey().GetFromMe() {
		return types.EmptyJID
	}
	return chat
}
