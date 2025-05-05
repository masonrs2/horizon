package util

import (
	"encoding/hex"
	"fmt"
	"strings"
)

// GetUUIDFromString converts a string UUID to a [16]byte array
// Accepts both hyphenated (e.g. "123e4567-e89b-12d3-a456-426614174000")
// and non-hyphenated (e.g. "123e4567e89b12d3a456426614174000") formats
func GetUUIDFromString(uuidStr string) ([16]byte, error) {
	var uuid [16]byte

	// Remove hyphens if present
	cleanUUID := strings.ReplaceAll(uuidStr, "-", "")

	bytes, err := hex.DecodeString(cleanUUID)
	if err != nil {
		return uuid, fmt.Errorf("invalid UUID format: %w", err)
	}
	if len(bytes) != 16 {
		return uuid, fmt.Errorf("invalid UUID length")
	}
	copy(uuid[:], bytes)
	return uuid, nil
}
