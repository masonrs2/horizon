package util

import (
	"encoding/hex"
	"fmt"
)

// GetUUIDFromString converts a string UUID to a [16]byte array
func GetUUIDFromString(uuidStr string) ([16]byte, error) {
	var uuid [16]byte
	bytes, err := hex.DecodeString(uuidStr)
	if err != nil {
		return uuid, fmt.Errorf("invalid UUID format: %w", err)
	}
	if len(bytes) != 16 {
		return uuid, fmt.Errorf("invalid UUID length")
	}
	copy(uuid[:], bytes)
	return uuid, nil
}
