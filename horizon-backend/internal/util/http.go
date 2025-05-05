package util

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/labstack/echo/v4"
)

// WriteJSON writes a JSON response
func WriteJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

// WriteError writes an error response
func WriteError(w http.ResponseWriter, status int, message string) {
	WriteJSON(w, status, map[string]string{"error": message})
}

// GetUserIDFromContext gets the user ID from the context
func GetUserIDFromContext(ctx context.Context) ([16]byte, error) {
	// First try to get pgtype.UUID
	if userID, ok := ctx.Value("user_id").(pgtype.UUID); ok && userID.Valid {
		var id [16]byte
		copy(id[:], userID.Bytes[:])
		return id, nil
	}

	// Then try to get [16]byte directly
	if userID, ok := ctx.Value("user_id").([16]byte); ok {
		return userID, nil
	}

	return [16]byte{}, ErrUnauthorized
}

// GetUUIDParam gets a UUID parameter from the URL
func GetUUIDParam(c echo.Context, param string) ([16]byte, error) {
	idStr := c.Param(param)
	if idStr == "" {
		return [16]byte{}, ErrInvalidUUID
	}

	var id [16]byte
	uuid := pgtype.UUID{}
	if err := uuid.Scan(idStr); err != nil {
		return [16]byte{}, ErrInvalidUUID
	}
	copy(id[:], uuid.Bytes[:])
	return id, nil
}
