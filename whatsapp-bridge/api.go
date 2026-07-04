package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"mime"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/proto/waE2E"
	"go.mau.fi/whatsmeow/types"
	"google.golang.org/protobuf/proto"
)

var nonDigit = regexp.MustCompile(`\D`)

// resolveRecipient turns either a raw phone number ("15551234567") or a
// full WhatsApp JID ("15551234567@s.whatsapp.net" / "123-456@g.us") into a JID.
func resolveRecipient(recipient string) (types.JID, error) {
	if strings.Contains(recipient, "@") {
		return types.ParseJID(recipient)
	}
	digits := nonDigit.ReplaceAllString(recipient, "")
	if digits == "" {
		return types.EmptyJID, fmt.Errorf("empty recipient")
	}
	return types.NewJID(digits, types.DefaultUserServer), nil
}

type sendTextRequest struct {
	Recipient string `json:"recipient"`
	Message   string `json:"message"`
}

type sendMediaRequest struct {
	Recipient string `json:"recipient"`
	MediaPath string `json:"media_path"`
}

type downloadRequest struct {
	MessageID string `json:"message_id"`
	ChatJID   string `json:"chat_jid"`
}

type apiResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Path    string `json:"path,omitempty"`
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}

func StartAPI(app *App, port string) {
	mux := http.NewServeMux()

	mux.HandleFunc("/api/send", app.handleSendText)
	mux.HandleFunc("/api/send/media", app.handleSendMedia)
	mux.HandleFunc("/api/download", app.handleDownload)
	mux.HandleFunc("/api/group/members", app.handleGroupMembers)

	if err := http.ListenAndServe("127.0.0.1:"+port, mux); err != nil {
		log.Fatalf("REST API server failed: %v", err)
	}
}

func (app *App) handleSendText(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, apiResponse{Message: "POST only"})
		return
	}
	var req sendTextRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, apiResponse{Message: "invalid JSON body"})
		return
	}

	to, err := resolveRecipient(req.Recipient)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, apiResponse{Message: err.Error()})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	_, err = app.Client.SendMessage(ctx, to, &waE2E.Message{
		Conversation: proto.String(req.Message),
	})
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, apiResponse{Message: fmt.Sprintf("failed to send message: %v", err)})
		return
	}
	writeJSON(w, http.StatusOK, apiResponse{Success: true, Message: "message sent"})
}

func (app *App) handleSendMedia(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, apiResponse{Message: "POST only"})
		return
	}
	var req sendMediaRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, apiResponse{Message: "invalid JSON body"})
		return
	}

	to, err := resolveRecipient(req.Recipient)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, apiResponse{Message: err.Error()})
		return
	}

	data, err := os.ReadFile(req.MediaPath)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, apiResponse{Message: fmt.Sprintf("failed to read file: %v", err)})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()

	mimeType := mime.TypeByExtension(filepath.Ext(req.MediaPath))
	if mimeType == "" {
		mimeType = "application/octet-stream"
	}

	msg, mediaKind, err := app.buildMediaMessage(ctx, data, mimeType, req.MediaPath)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, apiResponse{Message: err.Error()})
		return
	}

	if _, err := app.Client.SendMessage(ctx, to, msg); err != nil {
		writeJSON(w, http.StatusInternalServerError, apiResponse{Message: fmt.Sprintf("failed to send %s: %v", mediaKind, err)})
		return
	}
	writeJSON(w, http.StatusOK, apiResponse{Success: true, Message: fmt.Sprintf("%s sent", mediaKind)})
}

// buildMediaMessage uploads the raw file bytes to WhatsApp's media servers
// and wraps the resulting reference in the appropriate message type, chosen
// from the file's MIME type (falls back to a generic document).
func (app *App) buildMediaMessage(ctx context.Context, data []byte, mimeType, path string) (*waE2E.Message, string, error) {
	var appInfo whatsmeow.MediaType
	var kind string
	switch {
	case strings.HasPrefix(mimeType, "image/"):
		appInfo, kind = whatsmeow.MediaImage, "image"
	case strings.HasPrefix(mimeType, "video/"):
		appInfo, kind = whatsmeow.MediaVideo, "video"
	case strings.HasPrefix(mimeType, "audio/"):
		appInfo, kind = whatsmeow.MediaAudio, "audio"
	default:
		appInfo, kind = whatsmeow.MediaDocument, "document"
	}

	uploaded, err := app.Client.Upload(ctx, data, appInfo)
	if err != nil {
		return nil, kind, fmt.Errorf("failed to upload media: %w", err)
	}

	switch kind {
	case "image":
		return &waE2E.Message{ImageMessage: &waE2E.ImageMessage{
			URL: proto.String(uploaded.URL), DirectPath: proto.String(uploaded.DirectPath),
			MediaKey: uploaded.MediaKey, Mimetype: proto.String(mimeType),
			FileEncSHA256: uploaded.FileEncSHA256, FileSHA256: uploaded.FileSHA256,
			FileLength: proto.Uint64(uploaded.FileLength),
		}}, kind, nil
	case "video":
		return &waE2E.Message{VideoMessage: &waE2E.VideoMessage{
			URL: proto.String(uploaded.URL), DirectPath: proto.String(uploaded.DirectPath),
			MediaKey: uploaded.MediaKey, Mimetype: proto.String(mimeType),
			FileEncSHA256: uploaded.FileEncSHA256, FileSHA256: uploaded.FileSHA256,
			FileLength: proto.Uint64(uploaded.FileLength),
		}}, kind, nil
	case "audio":
		return &waE2E.Message{AudioMessage: &waE2E.AudioMessage{
			URL: proto.String(uploaded.URL), DirectPath: proto.String(uploaded.DirectPath),
			MediaKey: uploaded.MediaKey, Mimetype: proto.String(mimeType),
			FileEncSHA256: uploaded.FileEncSHA256, FileSHA256: uploaded.FileSHA256,
			FileLength: proto.Uint64(uploaded.FileLength), PTT: proto.Bool(false),
		}}, kind, nil
	default:
		return &waE2E.Message{DocumentMessage: &waE2E.DocumentMessage{
			URL: proto.String(uploaded.URL), DirectPath: proto.String(uploaded.DirectPath),
			MediaKey: uploaded.MediaKey, Mimetype: proto.String(mimeType),
			FileEncSHA256: uploaded.FileEncSHA256, FileSHA256: uploaded.FileSHA256,
			FileLength: proto.Uint64(uploaded.FileLength), FileName: proto.String(filepath.Base(path)),
		}}, kind, nil
	}
}

func (app *App) handleDownload(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, apiResponse{Message: "POST only"})
		return
	}
	var req downloadRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, apiResponse{Message: "invalid JSON body"})
		return
	}

	stored, err := app.Store.GetMessageMedia(req.MessageID, req.ChatJID)
	if err != nil {
		writeJSON(w, http.StatusNotFound, apiResponse{Message: err.Error()})
		return
	}

	downloadable, err := stored.downloadableMessage()
	if err != nil {
		writeJSON(w, http.StatusBadRequest, apiResponse{Message: err.Error()})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()
	data, err := app.Client.Download(ctx, downloadable)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, apiResponse{Message: fmt.Sprintf("failed to download media: %v", err)})
		return
	}

	dir := filepath.Join("store", "media", strings.ReplaceAll(req.ChatJID, ":", "_"))
	if err := os.MkdirAll(dir, 0755); err != nil {
		writeJSON(w, http.StatusInternalServerError, apiResponse{Message: err.Error()})
		return
	}
	name := stored.Filename
	if name == "" {
		name = req.MessageID
	}
	path := filepath.Join(dir, name)
	if err := os.WriteFile(path, data, 0644); err != nil {
		writeJSON(w, http.StatusInternalServerError, apiResponse{Message: err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, apiResponse{Success: true, Message: "media downloaded", Path: path})
}

type groupMembersRequest struct {
	ChatJID string `json:"chat_jid"`
}

type groupParticipant struct {
	JID          string `json:"jid"`
	PhoneNumber  string `json:"phone_number,omitempty"`
	Name         string `json:"name"`
	IsAdmin      bool   `json:"is_admin"`
	IsSuperAdmin bool   `json:"is_super_admin"`
}

type groupMembersResponse struct {
	Success          bool               `json:"success"`
	Message          string             `json:"message,omitempty"`
	GroupJID         string             `json:"group_jid,omitempty"`
	GroupName        string             `json:"group_name,omitempty"`
	ParticipantCount int                `json:"participant_count,omitempty"`
	Participants     []groupParticipant `json:"participants,omitempty"`
}

func (app *App) handleGroupMembers(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, apiResponse{Message: "POST only"})
		return
	}
	var req groupMembersRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, apiResponse{Message: "invalid JSON body"})
		return
	}

	jid, err := types.ParseJID(req.ChatJID)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, apiResponse{Message: fmt.Sprintf("invalid chat_jid: %v", err)})
		return
	}
	if jid.Server != types.GroupServer {
		writeJSON(w, http.StatusBadRequest, apiResponse{Message: "chat_jid must be a group JID (ending in @g.us)"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	info, err := app.Client.GetGroupInfo(ctx, jid)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, apiResponse{Message: fmt.Sprintf("failed to get group info: %v", err)})
		return
	}

	participants := make([]groupParticipant, 0, len(info.Participants))
	for _, p := range info.Participants {
		phoneNumber := ""
		if !p.PhoneNumber.IsEmpty() {
			phoneNumber = p.PhoneNumber.User
		}
		participants = append(participants, groupParticipant{
			JID:          p.JID.String(),
			PhoneNumber:  phoneNumber,
			Name:         chatDisplayName(ctx, app.Client, p.JID, p.DisplayName),
			IsAdmin:      p.IsAdmin,
			IsSuperAdmin: p.IsSuperAdmin,
		})
	}

	writeJSON(w, http.StatusOK, groupMembersResponse{
		Success:          true,
		GroupJID:         jid.String(),
		GroupName:        info.Name,
		ParticipantCount: len(participants),
		Participants:     participants,
	})
}
