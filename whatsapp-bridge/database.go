package main

import (
	"database/sql"
	"fmt"
	"time"

	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/proto/waE2E"
)

// MessageStore wraps our own SQLite database of synced chats and messages.
// This is separate from whatsmeow's device/session store - it exists purely
// so the Python MCP server can query history without talking to WhatsApp directly.
type MessageStore struct {
	db *sql.DB
}

func NewMessageStore(path string) (*MessageStore, error) {
	db, err := sql.Open("sqlite", fmt.Sprintf(
		"file:%s?_pragma=foreign_keys(1)&_pragma=busy_timeout(10000)&_pragma=journal_mode(WAL)", path))
	if err != nil {
		return nil, fmt.Errorf("failed to open message store: %w", err)
	}

	schema := `
	CREATE TABLE IF NOT EXISTS chats (
		jid TEXT PRIMARY KEY,
		name TEXT,
		last_message_time TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS messages (
		id TEXT,
		chat_jid TEXT,
		sender TEXT,
		content TEXT,
		timestamp TIMESTAMP,
		is_from_me BOOLEAN,
		media_type TEXT,
		filename TEXT,
		direct_path TEXT,
		media_key BLOB,
		file_sha256 BLOB,
		file_enc_sha256 BLOB,
		file_length INTEGER,
		PRIMARY KEY (id, chat_jid),
		FOREIGN KEY (chat_jid) REFERENCES chats(jid)
	);

	CREATE INDEX IF NOT EXISTS idx_messages_chat_jid ON messages(chat_jid);
	CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
	`
	if _, err := db.Exec(schema); err != nil {
		return nil, fmt.Errorf("failed to initialize schema: %w", err)
	}

	return &MessageStore{db: db}, nil
}

func (s *MessageStore) Close() error {
	return s.db.Close()
}

func (s *MessageStore) StoreChat(jid, name string, lastMessageTime time.Time) error {
	_, err := s.db.Exec(
		`INSERT INTO chats (jid, name, last_message_time) VALUES (?, ?, ?)
		 ON CONFLICT (jid) DO UPDATE SET
		   name = CASE WHEN excluded.name != '' THEN excluded.name ELSE chats.name END,
		   last_message_time = CASE WHEN excluded.last_message_time > chats.last_message_time
		                            THEN excluded.last_message_time ELSE chats.last_message_time END`,
		jid, name, lastMessageTime,
	)
	return err
}

type StoredMessage struct {
	ID            string
	ChatJID       string
	Sender        string
	Content       string
	Timestamp     time.Time
	IsFromMe      bool
	MediaType     string
	Filename      string
	DirectPath    string
	MediaKey      []byte
	FileSHA256    []byte
	FileEncSHA256 []byte
	FileLength    uint64
}

func (s *MessageStore) StoreMessage(m StoredMessage) error {
	if m.Content == "" && m.MediaType == "" {
		return nil
	}
	_, err := s.db.Exec(
		`INSERT INTO messages
			(id, chat_jid, sender, content, timestamp, is_from_me, media_type, filename,
			 direct_path, media_key, file_sha256, file_enc_sha256, file_length)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		 ON CONFLICT (id, chat_jid) DO UPDATE SET
			content = excluded.content,
			media_type = excluded.media_type,
			filename = excluded.filename,
			direct_path = excluded.direct_path,
			media_key = excluded.media_key,
			file_sha256 = excluded.file_sha256,
			file_enc_sha256 = excluded.file_enc_sha256,
			file_length = excluded.file_length`,
		m.ID, m.ChatJID, m.Sender, m.Content, m.Timestamp, m.IsFromMe, m.MediaType, m.Filename,
		m.DirectPath, m.MediaKey, m.FileSHA256, m.FileEncSHA256, m.FileLength,
	)
	return err
}

// GetMessageMedia fetches the stored media reference for a message so the
// bridge can re-download it from WhatsApp on demand.
func (s *MessageStore) GetMessageMedia(messageID, chatJID string) (*StoredMessage, error) {
	var m StoredMessage
	m.ID = messageID
	m.ChatJID = chatJID
	err := s.db.QueryRow(
		`SELECT media_type, filename, direct_path, media_key, file_sha256, file_enc_sha256, file_length
		 FROM messages WHERE id = ? AND chat_jid = ?`,
		messageID, chatJID,
	).Scan(&m.MediaType, &m.Filename, &m.DirectPath, &m.MediaKey, &m.FileSHA256, &m.FileEncSHA256, &m.FileLength)
	if err != nil {
		return nil, err
	}
	if m.MediaType == "" {
		return nil, fmt.Errorf("message %s in chat %s has no media", messageID, chatJID)
	}
	return &m, nil
}

// downloadableMessage rebuilds the concrete whatsmeow message struct for this
// media reference so it can be passed straight to Client.Download.
func (m *StoredMessage) downloadableMessage() (whatsmeow.DownloadableMessage, error) {
	base := struct {
		DirectPath    string
		MediaKey      []byte
		FileSHA256    []byte
		FileEncSHA256 []byte
	}{m.DirectPath, m.MediaKey, m.FileSHA256, m.FileEncSHA256}

	switch m.MediaType {
	case "image":
		return &waE2E.ImageMessage{
			DirectPath: &base.DirectPath, MediaKey: base.MediaKey,
			FileSHA256: base.FileSHA256, FileEncSHA256: base.FileEncSHA256,
		}, nil
	case "video":
		return &waE2E.VideoMessage{
			DirectPath: &base.DirectPath, MediaKey: base.MediaKey,
			FileSHA256: base.FileSHA256, FileEncSHA256: base.FileEncSHA256,
		}, nil
	case "audio":
		return &waE2E.AudioMessage{
			DirectPath: &base.DirectPath, MediaKey: base.MediaKey,
			FileSHA256: base.FileSHA256, FileEncSHA256: base.FileEncSHA256,
		}, nil
	case "document":
		return &waE2E.DocumentMessage{
			DirectPath: &base.DirectPath, MediaKey: base.MediaKey,
			FileSHA256: base.FileSHA256, FileEncSHA256: base.FileEncSHA256,
		}, nil
	default:
		return nil, fmt.Errorf("unsupported media type: %s", m.MediaType)
	}
}
